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
}

export class MapsScraperService extends EventEmitter {
  private isStopped: boolean = false;
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
      onlyWithInstagramOrWhatsapp = false
    } = options;

    this.isStopped = false;
    this.emit('status', this.userId, 'starting');
    
    try {
      this.emit('log', this.userId, 'Iniciando extração...');
      console.log(`[MapsScraper] Iniciando navegador invisível para usuário ${this.userId}...`);
      
      // Configuração para Render (usa Chrome do sistema)
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

      // No Render, tentar múltiplos caminhos do Chrome
      if (process.env.RENDER || process.env.RENDER_EXTERNAL_HOSTNAME) {
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
              console.log(`[MapsScraper] Usando Chrome em: ${path}`);
              foundChrome = true;
              break;
            }
          } catch (e) {
            // Continuar para o próximo caminho
          }
        }
        
        // Se não encontrar Chrome do sistema, usar @sparticuz/chromium
        if (!foundChrome) {
          try {
            const chromium = require('@sparticuz/chromium');
            launchOptions.executablePath = await chromium.executablePath();
            console.log(`[MapsScraper] Usando Chrome via @sparticuz/chromium: ${launchOptions.executablePath}`);
          } catch (e) {
            console.log(`[MapsScraper] @sparticuz/chromium não disponível: ${e}`);
            // Fallback para Puppeteer padrão
          }
        }
      }

      this.browser = await puppeteer.launch(launchOptions);

      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 2000 });
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
      this.emit('log', this.userId, `Buscando por: "${query}"...`);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
      } catch (e) {
        console.log(`[MapsScraper] Contêiner de resultados não encontrado rapidamente, tentando prosseguir...`);
      }

      this.emit('log', this.userId, 'Carregando lista de estabelecimentos...');
      
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
      }, linksToCollect);

      this.emit('log', this.userId, `Encontrados ${links.length} locais em potencial no Maps. Iniciando extração filtrada...`);
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

          await itemPage.close().catch(() => {});

          if (!placeData.title) continue;

          let cleanPhone = placeData.phone.replace(/\D/g, '');
          if (!cleanPhone) {
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (Sem número de telefone comercial)`);
            continue;
          }

          let localPhone = cleanPhone;
          if (localPhone.startsWith('55') && (localPhone.length === 12 || localPhone.length === 13)) {
            localPhone = localPhone.substring(2);
          }

          const isCellphone = localPhone.length === 11 && localPhone.startsWith('9');
          const isFixedPhone = localPhone.length === 10 || (localPhone.length === 11 && !localPhone.startsWith('9'));

          if (onlyCellphones && !isCellphone) {
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (${placeData.phone} não é celular/WhatsApp)`);
            continue;
          }

          if (excludeFixedPhones && isFixedPhone) {
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (${placeData.phone} é telefone fixo)`);
            continue;
          }

          const webLower = (placeData.website || '').toLowerCase();
          const hasInstagramOrWhatsapp = webLower.includes('instagram.com') || 
                                         webLower.includes('whatsapp') || 
                                         webLower.includes('wa.me');
          
          if (onlyWithInstagramOrWhatsapp && placeData.website && !hasInstagramOrWhatsapp) {
            this.emit('log', this.userId, `Ignorado: ${placeData.title} (Possui site institucional próprio: ${placeData.website})`);
            continue;
          }

          const result: ScrapedPlace = { ...placeData, url: link };
          validCount++;
          
          this.emit('item-scraped', this.userId, { item: result, current: validCount, total: maxItems });
          this.emit('log', this.userId, `Extraído (${validCount}/${maxItems}): ${result.title} (${result.phone})`);

        } catch (itemErr: any) {
          console.log(`[MapsScraper] Erro ao extrair link: ${itemErr.message}`);
        }
        
        await new Promise(r => setTimeout(r, 200));
      }

      if (!this.isStopped) {
        if (validCount < maxItems) {
          this.emit('log', this.userId, `Aviso: Pesquisa finalizada. Encontramos o máximo de leads possível na sua pesquisa. Apenas ${validCount} de ${maxItems} leads solicitados atendem às suas especificações.`);
        } else {
          this.emit('log', this.userId, `Extração finalizada com sucesso! Foram capturados ${validCount} leads qualificados.`);
        }
        this.emit('status', this.userId, 'completed');
      }
      
    } catch (error: any) {
      console.log(`[MapsScraper] Erro crítico na extração:`, error);
      const errMsg = error && error.message ? error.message : 'Erro desconhecido durante a extração';
      this.emit('log', this.userId, `Ocorreu um erro durante a extração: ${errMsg}`);
      this.emit('status', this.userId, 'error');
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
