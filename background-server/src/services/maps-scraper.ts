import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { EventEmitter } from 'events';

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
  onlyWithWebsite?: boolean;
  minRating?: number;
  minReviews?: number;
}

export class MapsScraperService extends EventEmitter {
  private isStopped: boolean = false;
  private isRunning: boolean = false;
  private browser: any = null;
  public userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  public async startScrape(options: ScrapeOptions) {
    const {
      query,
      limit: maxItems = 30,
      onlyCellphones = false,
      excludeFixedPhones = false,
      onlyWithInstagramOrWhatsapp = false,
      onlyWithWebsite = false,
      minRating = 0,
      minReviews = 0
    } = options;

    if (this.isRunning) {
      this.emit('log', this.userId, 'Extração já em andamento. Aguarde a conclusão ou pare antes de iniciar outra.');
      return;
    }
    this.isRunning = true;
    this.isStopped = false;
    this.emit('status', this.userId, 'starting');
    
    let page: any = null;
    try {
      this.emit('log', this.userId, 'Iniciando extração...');
      console.log(`[MapsScraper] Iniciando navegador invisível para usuário ${this.userId}...`);
      
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

      if (process.platform === 'linux') {
        launchOptions.args.push('--single-process');
        launchOptions.args.push('--no-zygote');
      }

      if (process.platform === 'linux' || process.env.RENDER || process.env.RENDER_EXTERNAL_HOSTNAME) {
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
              console.log(`[MapsScraper] Usando Chrome do sistema em: ${path}`);
              foundChrome = true;
              break;
            }
          } catch (e) {
            // Continuar
          }
        }
        
        if (!foundChrome) {
          try {
            const chromium = require('@sparticuz/chromium');
            launchOptions.executablePath = await chromium.executablePath();
            
            if (chromium.args && Array.isArray(chromium.args)) {
              for (const arg of chromium.args) {
                if (!launchOptions.args.includes(arg)) {
                  launchOptions.args.push(arg);
                }
              }
            }
            
            if (chromium.headless !== undefined) {
              launchOptions.headless = chromium.headless;
            }
            
            if (chromium.defaultViewport) {
              launchOptions.defaultViewport = chromium.defaultViewport;
            }

            console.log(`[MapsScraper] Usando Chrome via @sparticuz/chromium: ${launchOptions.executablePath}`);
          } catch (e: any) {
            console.log(`[MapsScraper] @sparticuz/chromium não disponível: ${e.message}. Usando Puppeteer padrão.`);
          }
        }
      }

      try {
        this.browser = await puppeteer.launch(launchOptions);
        this.emit('log', this.userId, 'Navegador aberto. Iniciando pesquisa...');
      } catch (launchErr: any) {
        console.error('[MapsScraper] Erro ao iniciar navegador:', launchErr);
        this.emit('log', this.userId, `Erro ao iniciar navegador: ${launchErr.message}`);
        throw launchErr;
      }

      page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 2000 });
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

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
      } catch (gotoErr: any) {
        this.emit('log', this.userId, `Erro ao acessar busca: ${gotoErr.message}`);
        throw gotoErr;
      }

      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
      } catch (e) {
        console.log(`[MapsScraper] Contêiner de resultados não encontrado rapidamente, tentando prosseguir...`);
      }

      this.emit('log', this.userId, 'Carregando lista de locais (rolando a página)...');
      
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
        console.error('[MapsScraper] Erro no page.evaluate (links):', evalErr);
        this.emit('log', this.userId, `Erro no evaluate (links): ${evalErr.message}`);
        return [];
      });

      this.emit('log', this.userId, `Encontrados ${links.length} locais. Iniciando extração...`);
      this.emit('status', this.userId, 'extracting');

      let validCount = 0;
      
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
          console.log(`[MapsScraper] Abrindo item: ${link}`);

          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 45000 });
          } catch (navErr: any) {
            console.warn(`[MapsScraper] Erro de navegação para ${link}: ${navErr.message}`);
            continue;
          }

          await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});

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

          if (onlyWithWebsite && !placeData.website) {
            console.log(`[MapsScraper] Ignorado por site: ${placeData.title}`);
            continue;
          }

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
            continue;
          }

          let localPhone = cleanPhone;
          if (localPhone.startsWith('55') && (localPhone.length === 12 || localPhone.length === 13)) {
            localPhone = localPhone.substring(2);
          }

          const isCellphone = (localPhone.length === 11 && localPhone[2] === '9') || (localPhone.length === 9 && localPhone[0] === '9');
          const isFixedPhone = localPhone.length === 10 || localPhone.length === 8 || (localPhone.length === 11 && localPhone[2] !== '9');

          if (onlyCellphones && !isCellphone) {
            console.log(`[MapsScraper] Ignorado por não ser celular: ${placeData.title} (${placeData.phone})`);
            continue;
          }

          if (excludeFixedPhones && isFixedPhone) {
            console.log(`[MapsScraper] Ignorado por ser fixo: ${placeData.title} (${placeData.phone})`);
            continue;
          }

          const webLower = (placeData.website || '').toLowerCase();
          const hasInstagramOrWhatsapp = webLower.includes('instagram.com') || 
                                         webLower.includes('whatsapp') || 
                                         webLower.includes('wa.me');
          
          if (onlyWithInstagramOrWhatsapp && placeData.website && !hasInstagramOrWhatsapp) {
            console.log(`[MapsScraper] Ignorado por falta de rede social: ${placeData.title}`);
            continue;
          }

          const result: ScrapedPlace = { ...placeData, url: link };
          validCount++;
          
          this.emit('item-scraped', this.userId, { item: result, current: validCount, total: maxItems });
          this.emit('log', this.userId, `[Extraído ${validCount}/${maxItems}] ${result.title} (${result.phone})`);

        } catch (itemErr: any) {
          console.error(`[MapsScraper] Erro ao extrair link: ${itemErr.message}`);
        }
        
        await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
      }

      if (!this.isStopped) {
        if (validCount < maxItems) {
          this.emit('log', this.userId, `Aviso: Pesquisa finalizada. Encontramos apenas ${validCount} de ${maxItems} leads que atendem aos critérios.`);
        } else {
          this.emit('log', this.userId, `Extração finalizada com sucesso! Foram capturados ${validCount} leads qualificados.`);
        }
        this.emit('status', this.userId, 'completed');
      }
      
    } catch (error: any) {
      console.error('[MapsScraper] Erro crítico na extração:', error);
      this.emit('log', this.userId, `Erro crítico na extração: ${error.message}`);
      this.emit('status', this.userId, 'error');
    } finally {
      this.isRunning = false;
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  public stop() {
    this.isStopped = true;
    this.isRunning = false;
    if (this.browser) {
      this.browser.close().catch(() => {});
      this.browser = null;
    }
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
