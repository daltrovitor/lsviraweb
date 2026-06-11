import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EventEmitter } from 'events';
<<<<<<< HEAD
=======
import { supabase } from '../utils/supabase';
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777

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
<<<<<<< HEAD
=======
  onlyWithWebsite?: boolean;
  minRating?: number;
  minReviews?: number;
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
}

export class MapsScraperService extends EventEmitter {
  private isStopped: boolean = false;
<<<<<<< HEAD
  private browser: any = null;
  public userId: string;
=======
  private isRunning: boolean = false;
  private browser: any = null;
  public userId: string;
  private validCount: number = 0;
  private maxItems: number = 30;
  private status: 'idle' | 'starting' | 'extracting' | 'completed' | 'error' | 'stopped' = 'idle';
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777

  constructor(userId: string) {
    super();
    this.userId = userId;
  }

<<<<<<< HEAD
=======
  public getStatus() {
    return {
      status: this.isRunning ? this.status : 'idle',
      current: this.validCount,
      total: this.maxItems
    };
  }

>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
  public async startScrape(options: ScrapeOptions) {
    const {
      query,
      limit: maxItems = 30,
      onlyCellphones = false,
      excludeFixedPhones = false,
<<<<<<< HEAD
      onlyWithInstagramOrWhatsapp = false
    } = options;

    this.isStopped = false;
    this.emit('status', this.userId, 'starting');
    
=======
      onlyWithInstagramOrWhatsapp = false,
      onlyWithWebsite = false,
      minRating = 0,
      minReviews = 0
    } = options;

    // Impedir múltiplas execuções simultâneas (causa principal de 6+ browsers abrindo ao mesmo tempo)
    if (this.isRunning) {
      this.emit('log', this.userId, 'Extração já em andamento. Aguarde a conclusão ou pare antes de iniciar outra.');
      return;
    }
    this.isRunning = true;
    this.isStopped = false;
    this.status = 'starting';
    this.validCount = 0;
    this.maxItems = maxItems;
    this.emit('status', this.userId, 'starting');

    // Criar a busca no Supabase para salvar leads em tempo real
    let searchId: string | null = null;
    if (supabase) {
      try {
        const { data: searchData, error: searchErr } = await supabase
          .from('scraped_searches')
          .insert({
            user_id: this.userId,
            query: query,
            target_limit: maxItems,
            found_count: 0,
            filters: {
              onlyCellphones,
              excludeFixedPhones: excludeFixedPhones || onlyCellphones,
              onlyWithInstagramOrWhatsapp,
              onlyWithWebsite,
              minRating,
              minReviews
            }
          })
          .select('id')
          .single();

        if (searchErr) {
          console.error('[MapsScraper] Erro ao criar registro de busca no Supabase:', searchErr);
        } else if (searchData) {
          searchId = searchData.id;
          console.log(`[MapsScraper] Registro de busca criado no Supabase com ID: ${searchId}`);
        }
      } catch (dbErr: any) {
        console.error('[MapsScraper] Exceção ao conectar com Supabase:', dbErr.message);
      }
    }
    
    let page: any = null;
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
    try {
      this.emit('log', this.userId, 'Iniciando extração...');
      console.log(`[MapsScraper] Iniciando navegador invisível para usuário ${this.userId}...`);

<<<<<<< HEAD
      // Configuração para Render (usa Chrome do sistema)
=======
      // Configuração base de lançamento
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
      const launchOptions: any = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--lang=pt-BR,pt',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      };

<<<<<<< HEAD
        // Log adicional para diagnóstico (depois de declarar launchOptions)
        this.emit('log', this.userId, `Debug: launchOptions=${JSON.stringify({ headless: launchOptions.headless, args: launchOptions.args?.slice(0,5) })}`);

      // No Render, tentar múltiplos caminhos do Chrome
      if (process.env.RENDER || process.env.RENDER_EXTERNAL_HOSTNAME) {
=======
      // Se for Linux, adicionar argumentos para baixo uso de memória
      if (process.platform === 'linux') {
        launchOptions.args.push('--single-process');
        launchOptions.args.push('--no-zygote');
      }

      // No Linux (Render/Railway/etc.), procurar ou configurar Chrome
      if (process.platform === 'linux' || process.env.RENDER || process.env.RENDER_EXTERNAL_HOSTNAME) {
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
        const possiblePaths = [
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/snap/bin/chromium'
        ];
        
        let foundChrome = false;
        for (const path of possiblePaths) {
          try {
            const fs = require('fs');
            if (fs.existsSync(path)) {
              launchOptions.executablePath = path;
<<<<<<< HEAD
              console.log(`[MapsScraper] Usando Chrome em: ${path}`);
=======
              console.log(`[MapsScraper] Usando Chrome do sistema em: ${path}`);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
              foundChrome = true;
              break;
            }
          } catch (e) {
<<<<<<< HEAD
            // Continuar para o próximo caminho
=======
            // Continuar
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
          }
        }
        
        // Se não encontrar Chrome do sistema, usar @sparticuz/chromium
        if (!foundChrome) {
          try {
            const chromium = require('@sparticuz/chromium');
            launchOptions.executablePath = await chromium.executablePath();
<<<<<<< HEAD
            console.log(`[MapsScraper] Usando Chrome via @sparticuz/chromium: ${launchOptions.executablePath}`);
          } catch (e) {
            console.log(`[MapsScraper] @sparticuz/chromium não disponível: ${e}`);
            // Fallback para Puppeteer padrão
=======
            
            // Adicionar argumentos necessários do @sparticuz/chromium
            if (chromium.args && Array.isArray(chromium.args)) {
              for (const arg of chromium.args) {
                if (!launchOptions.args.includes(arg)) {
                  launchOptions.args.push(arg);
                }
              }
            }
            
            // Usar o headless recomendado do @sparticuz/chromium
            if (chromium.headless !== undefined) {
              launchOptions.headless = chromium.headless;
            }
            
            if (chromium.defaultViewport) {
              launchOptions.defaultViewport = chromium.defaultViewport;
            }

            console.log(`[MapsScraper] Usando Chrome via @sparticuz/chromium: ${launchOptions.executablePath}`);
          } catch (e: any) {
            console.log(`[MapsScraper] @sparticuz/chromium não disponível: ${e.message}. Usando Puppeteer padrão.`);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
          }
        }
      }

      try {
        this.browser = await puppeteer.launch(launchOptions);
<<<<<<< HEAD
        this.emit('log', this.userId, 'Navegador iniciado com sucesso.');
      } catch (launchErr: any) {
        console.log('[MapsScraper] Erro ao iniciar navegador:', launchErr);
=======
        this.emit('log', this.userId, 'Navegador aberto. Iniciando pesquisa...');
      } catch (launchErr: any) {
        console.error('[MapsScraper] Erro ao iniciar navegador:', launchErr);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
        this.emit('log', this.userId, `Erro ao iniciar navegador: ${launchErr.message}`);
        throw launchErr;
      }

<<<<<<< HEAD
      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 2000 });
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      this.emit('log', this.userId, `Buscando por: "${query}"...`);
      this.emit('log', this.userId, `Debug: visitando busca: ${searchUrl}`);
      try {
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        this.emit('log', this.userId, 'Página de busca carregada.');
=======
      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 2000 });
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

      // Habilitar interceptação de requisições na busca para economizar recursos
      await page.setRequestInterception(true);
      page.on('request', (req: any) => {
        try {
          const url = req.url().toLowerCase();
          const resourceType = req.resourceType();
          if (
            ['image', 'font', 'media'].includes(resourceType) ||
            url.includes('/maps/vt') ||
            url.includes('/vt/') ||
            url.includes('/cbk') ||
            url.includes('google-analytics') ||
            url.includes('doubleclick')
          ) {
            req.abort().catch(() => {});
          } else {
            req.continue().catch(() => {});
          }
        } catch (err) {
          // Ignorar se a página fechar
        }
      });

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      this.emit('log', this.userId, `Buscando por "${query}" no Google Maps...`);
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Lidar com a tela de consentimento de cookies se ela aparecer
        try {
          const consentSelector = 'form[action*="consent.google.com"] button, button[aria-label="Aceitar tudo"], button[aria-label="Accept all"], button[aria-label="Aceitar todos"]';
          const consentButton = await page.$(consentSelector);
          if (consentButton) {
            await Promise.all([
              page.click(consentSelector),
              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {})
            ]);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (consentErr) {
          // Ignorar
        }
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
      } catch (gotoErr: any) {
        console.log('[MapsScraper] Erro ao acessar searchUrl:', gotoErr);
        this.emit('log', this.userId, `Erro ao acessar busca: ${gotoErr.message}`);
        throw gotoErr;
      }

      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
      } catch (e) {
        console.log(`[MapsScraper] Contêiner de resultados não encontrado rapidamente, tentando prosseguir...`);
      }

<<<<<<< HEAD
      this.emit('log', this.userId, 'Carregando lista de estabelecimentos...');
=======
      this.emit('log', this.userId, 'Carregando lista de locais (rolando a página)...');
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
      
      const linksToCollect = maxItems * 5;
      const links = await page.evaluate(async (max: number) => {
        const feed = document.querySelector('div[role="feed"]');
        if (!feed) return [];
        
        const linksSet = new Set<string>();
        let previousCount = 0;
        let noGrowthAttempts = 0;
        
        while (linksSet.size < max && noGrowthAttempts < 35) {
          const elements = Array.from(document.querySelectorAll('a[href*="/maps/place/"]')) as HTMLAnchorElement[];
          elements.forEach(el => {
            if (el.href && el.href.includes('/maps/place/')) linksSet.add(el.href);
          });
          
          if (linksSet.size === previousCount) {
            noGrowthAttempts++;
          } else {
            noGrowthAttempts = 0;
            previousCount = linksSet.size;
          }
          
          if (linksSet.size >= max) break;
          feed.scrollBy(0, 900);
          await new Promise(resolve => setTimeout(resolve, 600));
        }
        return Array.from(linksSet);
      }, linksToCollect).catch((evalErr: any) => {
        // Em caso de erro no evaluate, retornar lista vazia e logar
        console.error('[MapsScraper] Erro no page.evaluate (links):', evalErr);
        return [];
      });

<<<<<<< HEAD
      this.emit('log', this.userId, `Encontrados ${links.length} locais em potencial no Maps. Iniciando extração filtrada...`);
      this.emit('log', this.userId, `Debug: primeirasLinks=${JSON.stringify(links.slice(0,5))}`);
      this.emit('status', this.userId, 'extracting');

      let validCount = 0;
=======
      this.emit('log', this.userId, `Encontrados ${links.length} locais. Iniciando extração...`);
      this.status = 'extracting';
      this.emit('status', this.userId, 'extracting');

      let validCount = 0;
      this.validCount = 0;
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
      
      for (const link of links) {
        if (this.isStopped) {
          this.emit('log', this.userId, 'Extração interrompida pelo usuário.');
          break;
        }

        if (validCount >= maxItems) {
          this.emit('log', this.userId, `Meta de ${maxItems} leads alcançada com sucesso!`);
          break;
        }

        try {
<<<<<<< HEAD
          this.emit('log', this.userId, `Abrindo página item: ${link}`);
          const itemPage = await this.browser.newPage();
          await itemPage.setViewport({ width: 1920, height: 2000 });
          await itemPage.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

          try {
            await itemPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 45000 });
          } catch (navErr: any) {
            this.emit('log', this.userId, `Erro de navegação para ${link}: ${navErr.message}`);
            await itemPage.close().catch(() => {});
            continue;
          }

          await itemPage.waitForSelector('h1', { timeout: 6000 }).catch(() => {});

          const placeData = await itemPage.evaluate(() => {
=======
          console.log(`[MapsScraper] Abrindo item: ${link}`);

          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 45000 });
          } catch (navErr: any) {
            console.warn(`[MapsScraper] Erro de navegação para ${link}: ${navErr.message}`);
            continue;
          }

          await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});

          const placeData = await page.evaluate(() => {
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
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
            
<<<<<<< HEAD
            return { title, address, phone, website, rating, category };
          });

          await itemPage.close().catch(() => {});
          this.emit('log', this.userId, `Página item fechada: ${link}`);

          if (!placeData.title) continue;

          let cleanPhone = placeData.phone.replace(/\D/g, '');
          if (!cleanPhone) {
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (Sem número de telefone comercial)`);
=======
            // Extract reviews count
            let reviews = '0';
            const reviewsEl = document.querySelector('button[jsaction*="pane.rating.moreReviews"]');
            if (reviewsEl) {
              reviews = reviewsEl.textContent?.replace(/\D/g, '') || '0';
            } else {
              const f7niceText = document.querySelector('div.F7nice')?.textContent || '';
              const match = f7niceText.match(/\((\d+)\)/);
              if (match) {
                reviews = match[1];
              }
            }
            
            return { title, address, phone, website, rating, category, reviews };
          });

          if (!placeData.title) continue;

          // Apply Website Filter
          if (onlyWithWebsite && !placeData.website) {
            console.log(`[MapsScraper] Ignorado por site: ${placeData.title}`);
            continue;
          }

          // Apply Rating and Reviews Filters
          const numRating = parseFloat((placeData.rating || '').replace(',', '.')) || 0;
          const numReviews = parseInt(placeData.reviews || '0', 10) || 0;

          if (minRating && numRating < minRating) {
            console.log(`[MapsScraper] Ignorado por nota (${numRating} < ${minRating}): ${placeData.title}`);
            continue;
          }

          if (minReviews && numReviews < minReviews) {
            console.log(`[MapsScraper] Ignorado por avaliações (${numReviews} < ${minReviews}): ${placeData.title}`);
            continue;
          }

          let cleanPhone = placeData.phone.replace(/\D/g, '');
          if (!cleanPhone) {
            console.log(`[MapsScraper] Ignorado por falta de telefone: ${placeData.title}`);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
            continue;
          }

          let localPhone = cleanPhone;
          if (localPhone.startsWith('55') && (localPhone.length === 12 || localPhone.length === 13)) {
            localPhone = localPhone.substring(2);
          }

<<<<<<< HEAD
          const isCellphone = localPhone.length === 11 && localPhone.startsWith('9');
          const isFixedPhone = localPhone.length === 10 || (localPhone.length === 11 && !localPhone.startsWith('9'));

          if (onlyCellphones && !isCellphone) {
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (${placeData.phone} não é celular/WhatsApp)`);
=======
          // Mobile and Fixed phone recognition (correcting index checking)
          const isCellphone = (localPhone.length === 11 && localPhone[2] === '9') || (localPhone.length === 9 && localPhone[0] === '9');
          const isFixedPhone = localPhone.length === 10 || localPhone.length === 8 || (localPhone.length === 11 && localPhone[2] !== '9');

          if (onlyCellphones && !isCellphone) {
            console.log(`[MapsScraper] Ignorado por não ser celular: ${placeData.title} (${placeData.phone})`);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
            continue;
          }

          if (excludeFixedPhones && isFixedPhone) {
<<<<<<< HEAD
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (${placeData.phone} é telefone fixo)`);
=======
            console.log(`[MapsScraper] Ignorado por ser fixo: ${placeData.title} (${placeData.phone})`);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
            continue;
          }

          const webLower = (placeData.website || '').toLowerCase();
          const hasInstagramOrWhatsapp = webLower.includes('instagram.com') || 
                                         webLower.includes('whatsapp') || 
                                         webLower.includes('wa.me');
          
          if (onlyWithInstagramOrWhatsapp && placeData.website && !hasInstagramOrWhatsapp) {
<<<<<<< HEAD
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (Possui site institucional próprio: ${placeData.website})`);
=======
            console.log(`[MapsScraper] Ignorado por falta de rede social: ${placeData.title}`);
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
            continue;
          }

          const result: ScrapedPlace = { ...placeData, url: link };
          validCount++;
<<<<<<< HEAD
          
          this.emit('item-scraped', this.userId, { item: result, current: validCount, total: maxItems });
          this.emit('log', this.userId, `Extraído (${validCount}/${maxItems}): ${result.title} (${result.phone})`);

        } catch (itemErr: any) {
          console.log(`[MapsScraper] Erro ao extrair link: ${itemErr.message}`);
        }
        
        await new Promise(r => setTimeout(r, 200));
=======
          this.validCount = validCount;

          // Inserir lead no banco em tempo real
          if (supabase && searchId) {
            try {
              const { error: leadErr } = await supabase
                .from('scraped_leads')
                .insert({
                  search_id: searchId,
                  title: result.title,
                  address: result.address || '',
                  phone: result.phone || '',
                  website: result.website || '',
                  rating: result.rating || '',
                  category: result.category || '',
                  url: result.url || ''
                });

              if (leadErr) {
                console.error(`[MapsScraper] Erro ao salvar lead ${result.title} no Supabase:`, leadErr);
              } else {
                // Atualizar found_count na busca
                await supabase
                  .from('scraped_searches')
                  .update({ found_count: validCount })
                  .eq('id', searchId);
              }
            } catch (dbErr: any) {
              console.error('[MapsScraper] Exceção ao salvar lead no Supabase:', dbErr.message);
            }
          }
          
          this.emit('item-scraped', this.userId, { item: result, current: validCount, total: maxItems });
          this.emit('log', this.userId, `[Extraído ${validCount}/${maxItems}] ${result.title} (${result.phone})`);

        } catch (itemErr: any) {
          console.error(`[MapsScraper] Erro ao extrair link: ${itemErr.message}`);
        }
        
        // Delay maior entre itens para evitar detecção de bot e reduzir uso de CPU
        await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
      }

      if (!this.isStopped) {
        if (validCount < maxItems) {
<<<<<<< HEAD
          this.emit('log', this.userId, `Aviso: Pesquisa finalizada. Encontramos o máximo de leads possível na sua pesquisa. Apenas ${validCount} de ${maxItems} leads solicitados atendem às suas especificações.`);
        } else {
          this.emit('log', this.userId, `Extração finalizada com sucesso! Foram capturados ${validCount} leads qualificados.`);
        }
=======
          this.emit('log', this.userId, `Aviso: Pesquisa finalizada. Encontramos apenas ${validCount} de ${maxItems} leads que atendem aos critérios.`);
        } else {
          this.emit('log', this.userId, `Extração finalizada com sucesso! Foram capturados ${validCount} leads qualificados.`);
        }
        this.status = 'completed';
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
        this.emit('status', this.userId, 'completed');
      }
      
    } catch (error: any) {
      console.error(`[MapsScraper] Erro crítico na extração:`, error);
<<<<<<< HEAD
      const errMsg = error && error.message ? error.message : 'Erro desconhecido durante a extração';
      this.emit('log', this.userId, `Ocorreu um erro durante a extração: ${errMsg}`);
      this.emit('status', this.userId, 'error');
      throw error;
    } finally {
=======
      
      let errMsg = error && error.message ? error.message : 'Erro desconhecido durante a extração';
      if (errMsg.includes('timeout') || errMsg.includes('waiting for selector')) {
        errMsg = `Tempo limite esgotado. Isso pode ocorrer por lentidão da rede. (${errMsg})`;
      }
      this.emit('log', this.userId, `Ocorreu um erro durante a extração: ${errMsg}`);
      this.status = 'error';
      this.emit('status', this.userId, 'error');
      throw error;
    } finally {
      this.isRunning = false;
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  public stop() {
    this.isStopped = true;
<<<<<<< HEAD
=======
    this.isRunning = false;
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
    if (this.browser) {
      this.browser.close().catch(() => {});
      this.browser = null;
    }
<<<<<<< HEAD
=======
    this.status = 'stopped';
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
    this.emit('status', this.userId, 'stopped');
  }
}

class MapsScraperManager extends EventEmitter {
  private services: Map<string, MapsScraperService> = new Map();

  public getService(userId: string): MapsScraperService {
    if (!this.services.has(userId)) {
      const service = new MapsScraperService(userId);
      service.on('status', (uid, status) => this.emit('status', uid, status));
      service.on('log', (uid, msg) => this.emit('log', uid, msg));
      service.on('item-scraped', (uid, data) => this.emit('item-scraped', uid, data));
      this.services.set(userId, service);
    }
    return this.services.get(userId)!;
  }
}

export const mapsScraperManager = new MapsScraperManager();
