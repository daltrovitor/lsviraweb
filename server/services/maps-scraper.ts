import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EventEmitter } from 'events';

// Configura o plugin stealth para evitar detecção
puppeteer.use(StealthPlugin());

export interface ScrapedPlace {
  title: string;
  address: string;
  phone: string;
  website: string;
  rating: string;
  category: string;
  url: string;
}

export interface ScrapeOptions {
  query: string;
  limit: number;
  onlyCellphones?: boolean;
  excludeFixedPhones?: boolean;
  onlyWithInstagramOrWhatsapp?: boolean;
}

export class MapsScraperService extends EventEmitter {
  private isStopped: boolean = false;
  private browser: any = null;

  constructor() {
    super();
  }

  public async startScrape(options: ScrapeOptions) {
    const {
      query,
      limit: maxItems = 30,
      onlyCellphones = false,
      excludeFixedPhones = false,
      onlyWithInstagramOrWhatsapp = false
    } = options;

    this.isStopped = false;
    this.emit('status', 'starting');
    
    try {
      this.emit('log', 'Iniciando navegador invisível...');
      this.browser = await puppeteer.launch({
        headless: true, // Use false para debugar visualmente
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--lang=pt-BR,pt'
        ]
      });

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 2000 }); // Viewport bem maior
      // Define idioma para garantir que seletores baseados em texto (caso necessário) funcionem
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      this.emit('log', `Buscando por: "${query}"...`);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Espera o feed lateral carregar
      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
      } catch (e) {
        this.emit('log', 'Aviso: Contêiner de resultados (feed) não encontrado rapidamente, tentando prosseguir...');
      }

      this.emit('log', 'Carregando lista de estabelecimentos...');
      
      // Coleta muito mais links do que o necessário para compensar filtros
      const linksToCollect = maxItems * 5;
      const links = await page.evaluate(async (max: number) => {
        const feed = document.querySelector('div[role="feed"]');
        if (!feed) return [];
        
        const linksSet = new Set<string>();
        let previousCount = 0;
        let noGrowthAttempts = 0;
        
        // Faz scroll gradual até conseguir muitos links
        while (linksSet.size < max && noGrowthAttempts < 35) {
          // Coleta links visíveis
          const elements = Array.from(document.querySelectorAll('a[href*="/maps/place/"]')) as HTMLAnchorElement[];
          elements.forEach(el => {
            if (el.href && el.href.includes('/maps/place/')) {
              linksSet.add(el.href);
            }
          });
          
          // Verifica se conseguiu novos links
          if (linksSet.size === previousCount) {
            noGrowthAttempts++;
          } else {
            noGrowthAttempts = 0;
            previousCount = linksSet.size;
          }
          
          if (linksSet.size >= max) break;
          
          // Scroll gradual
          feed.scrollBy(0, 900);
          
          // Aguarda carregamento dos novos itens
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        
        return Array.from(linksSet);
      }, linksToCollect);

      this.emit('log', `Encontrados ${links.length} locais em potencial no Maps. Iniciando extração filtrada...`);
      this.emit('status', 'extracting');

      let validCount = 0;
      let processedCount = 0;
      
      for (const link of links) {
        processedCount++;
        if (this.isStopped) {
          this.emit('log', 'Extração interrompida pelo usuário.');
          break;
        }

        // Para quando conseguir o número exato desejado
        if (validCount >= maxItems) {
          this.emit('log', `Meta de ${maxItems} leads alcançada com sucesso!`);
          break;
        }

        try {
          await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
          // Esperar pelo menos o h1 carregar para garantir que os dados vitais estão lá
          await page.waitForSelector('h1', { timeout: 6000 }).catch(() => {});

          const placeData = await page.evaluate(() => {
            const title = document.querySelector('h1')?.textContent?.trim() || '';
            const address = document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || '';
            const phone = document.querySelector('button[data-item-id^="phone:tel:"]')?.textContent?.trim() || 
                          document.querySelector('[data-item-id^="phone"]')?.textContent?.trim() || '';
            const website = document.querySelector('a[data-item-id="authority"]')?.getAttribute('href') || 
                            document.querySelector('a[data-item-id="authority"]')?.textContent?.trim() || '';
            const rating = document.querySelector('div.F7nice span[aria-hidden="true"]')?.textContent?.trim() || 
                           document.querySelector('span[aria-label*="estrelas"]')?.textContent?.trim() || '';
            const category = document.querySelector('button[jsaction*="category"]')?.textContent?.trim() || 
                             document.querySelector('button.DkEaL')?.textContent?.trim() || '';
            
            return { title, address, phone, website, rating, category };
          });

          if (!placeData.title) continue;

          // Sanitizar telefone para aplicação das regras
          let cleanPhone = placeData.phone.replace(/\D/g, '');
          
          // Rejeita estabelecimentos sem telefone
          if (!cleanPhone) {
            this.emit('log', `Ignorado: ${placeData.title} (Sem número de telefone comercial)`);
            continue;
          }

          // Tratar DDI 55
          let localPhone = cleanPhone;
          if (localPhone.startsWith('55') && (localPhone.length === 12 || localPhone.length === 13)) {
            localPhone = localPhone.substring(2);
          }

          // Regras de Celulares vs Telefones Fixos no Brasil:
          // Telefones celulares com DDD têm 11 dígitos e começam com 9: DD 9XXXX-XXXX
          // Telefones fixos têm 10 dígitos e geralmente começam com 2, 3, 4 ou 5: DD XXXX-XXXX
          const isCellphone = localPhone.length === 11 && localPhone.startsWith('9');
          const isFixedPhone = localPhone.length === 10 || (localPhone.length === 11 && !localPhone.startsWith('9'));

          // 1. Filtrar apenas celulares
          if (onlyCellphones && !isCellphone) {
            this.emit('log', `Ignorado: ${placeData.title} (${placeData.phone} não é celular celular/WhatsApp)`);
            continue;
          }

          // 2. Filtrar exclusão de fixos
          if (excludeFixedPhones && isFixedPhone) {
            this.emit('log', `Ignorado: ${placeData.title} (${placeData.phone} é telefone fixo)`);
            continue;
          }

          // 3. Filtrar por presença de redes sociais (apenas Instagram/WhatsApp)
          const webLower = (placeData.website || '').toLowerCase();
          const hasInstagramOrWhatsapp = webLower.includes('instagram.com') || 
                                         webLower.includes('whatsapp') || 
                                         webLower.includes('wa.me');
          
          if (onlyWithInstagramOrWhatsapp && placeData.website && !hasInstagramOrWhatsapp) {
            this.emit('log', `Ignorado: ${placeData.title} (Possui site institucional próprio: ${placeData.website})`);
            continue;
          }

          const result: ScrapedPlace = { ...placeData, url: link };
          validCount++;
          
          this.emit('item-scraped', { item: result, current: validCount, total: maxItems });
          this.emit('log', `Extraído (${validCount}/${maxItems}): ${result.title} (${result.phone})`);

        } catch (itemErr: any) {
          this.emit('log', `Erro ao extrair link: ${itemErr.message}`);
        }
        
        // Pausa pequena de segurança
        await new Promise(r => setTimeout(r, 200));
      }

      if (!this.isStopped) {
        if (validCount < maxItems) {
          this.emit('log', `Aviso: Pesquisa finalizada. Encontramos o máximo de leads possível na sua pesquisa. Apenas ${validCount} de ${maxItems} leads solicitados atendem às suas especificações.`);
        } else {
          this.emit('log', `Extração finalizada com sucesso! Foram capturados ${validCount} leads qualificados.`);
        }
        this.emit('status', 'completed');
      }
      
    } catch (error: any) {
      this.emit('log', `Erro crítico na extração: ${error.message}`);
      this.emit('status', 'error');
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  public stop() {
    this.isStopped = true;
    if (this.browser) {
      this.browser.close().catch(() => {});
      this.browser = null;
    }
    this.emit('status', 'stopped');
  }
}

export const mapsScraperService = new MapsScraperService();
