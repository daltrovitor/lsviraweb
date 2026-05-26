import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { MapsScraperService, mapsScraperManager } from './services/maps-scraper';

// ==========================================
// CONFIGURAÇÃO EXPRESS (Health Check para Render)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

// Rota de health check - Render exige uma porta HTTP aberta
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Iniciar servidor HTTP
app.listen(PORT, () => {
  console.log(`[HTTP] Health check server rodando na porta ${PORT}`);
});

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('[SUPABASE] Cliente inicializado');

// ==========================================
// INTERFACES
// ==========================================
interface ScraperJob {
  id: string;
  user_id: string;
  query: string;
  limit: number;
  only_cellphones: boolean;
  exclude_fixed_phones: boolean;
  only_with_instagram_or_whatsapp: boolean;
  status: string;
  current_count: number;
  total_count: number;
}

// ==========================================
// MAPS SCRAPER WRAPPER
// ==========================================
// Wrapper para interceptar eventos do scraper e salvar no Supabase
class ScraperWrapper {
  private jobId: string;
  private userId: string;

  constructor(jobId: string, userId: string) {
    this.jobId = jobId;
    this.userId = userId;
  }

  // Interceptar eventos do scraper e salvar no Supabase
  public setupListeners(scraper: any) {
    // Log events
    scraper.on('log', async (uid: string, message: string) => {
      if (uid === this.userId) {
        console.log(`[LOG] ${message}`);
        await supabase.from('scraper_logs').insert({
          job_id: this.jobId,
          message,
          level: 'info',
        });
      }
    });

    // Status events
    scraper.on('status', async (uid: string, status: string) => {
      if (uid === this.userId) {
        console.log(`[STATUS] ${status}`);
        const updateData: any = { status };
        
        if (status === 'processing') {
          updateData.started_at = new Date().toISOString();
        }
        
        if (status === 'completed' || status === 'error' || status === 'stopped') {
          updateData.completed_at = new Date().toISOString();
        }
        
        await supabase.from('scraper_jobs').update(updateData).eq('id', this.jobId);
      }
    });

    // Item scraped events
    scraper.on('item-scraped', async (uid: string, data: any) => {
      if (uid === this.userId) {
        const { item, current, total } = data;
        console.log(`[ITEM] ${item.title} (${current}/${total})`);
        
        // Salvar resultado
        await supabase.from('scraper_results').insert({
          job_id: this.jobId,
          title: item.title,
          address: item.address,
          phone: item.phone,
          website: item.website,
          rating: item.rating,
          category: item.category,
          url: item.url,
        });
        
        // Atualizar contador
        await supabase.from('scraper_jobs').update({
          current_count: current,
          total_count: total,
        }).eq('id', this.jobId);
      }
    });
  }
}

// ==========================================
// JOB PROCESSOR
// ==========================================
const activeJobs = new Map<string, any>();

async function processJob(job: ScraperJob) {
  console.log(`[JOB] Processando job ${job.id} para usuário ${job.user_id}: "${job.query}"`);

  // Atualizar status para processing
  await supabase.from('scraper_jobs').update({
    status: 'processing',
    started_at: new Date().toISOString(),
  }).eq('id', job.id);

  // Criar scraper service usando o código existente
  const scraper = mapsScraperManager.getService(job.user_id);
  const wrapper = new ScraperWrapper(job.id, job.user_id);
  
  // Configurar listeners para salvar no Supabase
  wrapper.setupListeners(scraper);
  
  activeJobs.set(job.id, scraper);

  try {
    // Chamar startScrape com os parâmetros do job
    await scraper.startScrape({
      query: job.query,
      limit: job.limit,
      onlyCellphones: job.only_cellphones,
      excludeFixedPhones: job.exclude_fixed_phones,
      onlyWithInstagramOrWhatsapp: job.only_with_instagram_or_whatsapp,
    });
    
    console.log(`[JOB] Job ${job.id} completado com sucesso`);
  } catch (error: any) {
    console.error(`[JOB] Erro ao processar job ${job.id}:`, error);
    
    // Atualizar status para failed
    await supabase.from('scraper_jobs').update({
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);
    
    // Salvar log do erro
    await supabase.from('scraper_logs').insert({
      job_id: job.id,
      message: `Erro fatal: ${error.message}`,
      level: 'error',
    });
  } finally {
    activeJobs.delete(job.id);
  }
}

// ==========================================
// SUPABASE REALTIME LISTENER
// ==========================================
async function setupRealtimeListener() {
  console.log('[REALTIME] Configurando listener para scraper_jobs...');

  const channel = supabase
    .channel('scraper_jobs_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'scraper_jobs',
        filter: 'status=eq.pending',
      },
      async (payload) => {
        const job = payload.new as ScraperJob;
        console.log(`[REALTIME] Novo job detectado: ${job.id}`);
        
        // Processar job em background
        processJob(job).catch(err => {
          console.error(`[REALTIME] Erro ao processar job ${job.id}:`, err);
        });
      }
    )
    .subscribe((status) => {
      console.log(`[REALTIME] Status do subscription: ${status}`);
    });

  return channel;
}

// ==========================================
// CLEANUP ON SHUTDOWN
// ==========================================
async function cleanup() {
  console.log('[SHUTDOWN] Parando jobs ativos...');
  Array.from(activeJobs.entries()).forEach(([jobId, scraper]) => {
    scraper.stop();
  });
  activeJobs.clear();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// ==========================================
// START SERVER
// ==========================================
async function start() {
  console.log('[SERVER] Iniciando Background Server...');
  console.log('[SERVER] Conectado ao Supabase:', supabaseUrl);

  await setupRealtimeListener();

  console.log('[SERVER] Background Server rodando e aguardando jobs...');
  console.log('[SERVER] Health check disponível em http://localhost:' + PORT);
}

start().catch(err => {
  console.error('[SERVER] Erro ao iniciar:', err);
  process.exit(1);
});
