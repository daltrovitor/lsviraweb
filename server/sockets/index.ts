import { Server } from 'socket.io';
import { whatsappManager } from '../services/whatsapp';
import { campaignManager } from '../services/campaign';
import { Campaign } from '../types';
import { mapsScraperManager } from '../services/maps-scraper';
import { supabaseAdmin } from '../utils/supabase';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket) => {
    let currentUserId: string | null = null;
    console.log('Cliente conectado:', socket.id);

    // Registro do Socket ao Usuário
    socket.on('register', async (data: any) => {
      let userId: string;
      let token: string | undefined;

      if (typeof data === 'string') {
        userId = data;
      } else if (data && typeof data === 'object') {
        userId = data.userId;
        token = data.token;
      } else {
        return socket.emit('error', 'Formato de registro inválido');
      }

      if (token && supabaseAdmin) {
        try {
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
          if (error || !user) {
            console.error(`[Socket Auth] Token inválido para tentativa de registro do usuário ${userId}`);
            return socket.emit('error', 'Sessão inválida ou expirada');
          }
          if (user.id !== userId) {
            console.error(`[Socket Auth] Incompatibilidade de ID de usuário: Token=${user.id}, Enviado=${userId}`);
            return socket.emit('error', 'Acesso não autorizado');
          }
        } catch (err: any) {
          console.error('[Socket Auth] Erro ao validar token:', err.message);
          return socket.emit('error', 'Falha na validação de autenticação');
        }
      } else if (process.env.NODE_ENV === 'production') {
        console.error(`[Socket Auth] Registro sem token recusado em produção para usuário ${userId}`);
        return socket.emit('error', 'Autenticação necessária');
      } else {
        console.warn(`[Socket Auth] Registro de usuário ${userId} sem token (Permitido em modo desenvolvimento)`);
      }

      console.log(`Socket ${socket.id} registrado para usuário: ${userId}`);
      currentUserId = userId;
      
      // Enviar status atual ao conectar
      const waService = whatsappManager.getService(userId);
      socket.emit('whatsapp-status', waService.getStatus());

      // Enviar status do Maps Scraper ao conectar (para restabelecer estado se o usuário recarregar)
      const scraper = mapsScraperManager.getService(userId);
      const scraperStatus = scraper.getStatus();
      socket.emit('maps-status', scraperStatus.status);
      
      if (scraperStatus.status === 'extracting' || scraperStatus.status === 'starting') {
        socket.emit('maps-item-scraped', {
          item: null,
          current: scraperStatus.current,
          total: scraperStatus.total
        });
      }

      // Enviar status da campanha ativa ao conectar
      const campaignService = campaignManager.getService(userId);
      const activeCampaign = campaignService.getCampaign();
      if (activeCampaign) {
        socket.emit('campaign-update', activeCampaign);
      }
    });

    socket.on('get-whatsapp-status', () => {
      if (currentUserId) {
        const waService = whatsappManager.getService(currentUserId);
        socket.emit('whatsapp-status', waService.getStatus());
      }
    });

    socket.on('get-maps-status', () => {
      if (currentUserId) {
        const scraper = mapsScraperManager.getService(currentUserId);
        const scraperStatus = scraper.getStatus();
        socket.emit('maps-status', scraperStatus.status);
        
        if (scraperStatus.status === 'extracting' || scraperStatus.status === 'starting') {
          socket.emit('maps-item-scraped', {
            item: null,
            current: scraperStatus.current,
            total: scraperStatus.total
          });
        }
      }
    });

    socket.on('get-campaign-status', () => {
      if (currentUserId) {
        const campaignService = campaignManager.getService(currentUserId);
        const activeCampaign = campaignService.getCampaign();
        if (activeCampaign) {
          socket.emit('campaign-update', activeCampaign);
        }
      }
    });

    // Handlers
    const onWhatsappStatus = (uid: string, status: any) => {
      if (uid === currentUserId) socket.emit('whatsapp-status', status);
    };

    const onCampaignUpdate = (uid: string, campaign: any) => {
      if (uid === currentUserId) socket.emit('campaign-update', campaign);
    };

    const onCampaignLog = (uid: string, message: any) => {
      if (uid === currentUserId) socket.emit('log', { message, timestamp: new Date() });
    };

    const onScraperLog = (uid: string, msg: string) => {
      if (uid === currentUserId) socket.emit('maps-log', { message: msg, timestamp: new Date() });
    };

    const onScraperStatus = (uid: string, status: string) => {
      if (uid === currentUserId) socket.emit('maps-status', status);
    };

    const onScraperItem = (uid: string, data: any) => {
      if (uid === currentUserId) socket.emit('maps-item-scraped', data);
    };

    // Listeners Globais
    whatsappManager.on('status', onWhatsappStatus);
    campaignManager.on('update', onCampaignUpdate);
    campaignManager.on('log', onCampaignLog);
    mapsScraperManager.on('log', onScraperLog);
    mapsScraperManager.on('status', onScraperStatus);
    mapsScraperManager.on('item-scraped', onScraperItem);

    // Comandos do Frontend
    socket.on('start-campaign', async (campaign: Campaign) => {
      if (!currentUserId) return socket.emit('error', 'Usuário não registrado no socket');
      try {
        const campaignService = campaignManager.getService(currentUserId);
        await campaignService.startCampaign(campaign);
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('pause-campaign', () => {
      if (!currentUserId) return;
      campaignManager.getService(currentUserId).pause();
    });

    socket.on('resume-campaign', () => {
      if (!currentUserId) return;
      campaignManager.getService(currentUserId).resume();
    });

    socket.on('stop-campaign', () => {
      if (!currentUserId) return;
      campaignManager.getService(currentUserId).stop();
    });

    socket.on('clear-campaign', () => {
      if (!currentUserId) return;
      campaignManager.getService(currentUserId).clearCampaign();
    });

    socket.on('get-groups', async (callback) => {
      if (!currentUserId) return callback && callback({ success: false, error: 'Não registrado' });
      try {
        const groups = await whatsappManager.getService(currentUserId).getGroups();
        if(callback) callback({ success: true, data: groups });
      } catch (error: any) {
        if(callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('get-group-members', async (groupId: string, callback) => {
      if (!currentUserId) return callback && callback({ success: false, error: 'Não registrado' });
      try {
        const members = await whatsappManager.getService(currentUserId).getGroupMembers(groupId);
        if(callback) callback({ success: true, data: members });
      } catch (error: any) {
        if(callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('whatsapp-logout', async () => {
      if (!currentUserId) return;
      await whatsappManager.getService(currentUserId).logout();
    });

    socket.on('start-maps-scrape', async ({ query, limit, onlyCellphones, excludeFixedPhones, onlyWithInstagramOrWhatsapp, onlyWithWebsite, minRating, minReviews }) => {
      if (!currentUserId) return socket.emit('error', 'Não registrado');
      console.log(`[Maps Scrape] ✓ Iniciando para usuário ${currentUserId}: "${query}" (limite: ${limit})`);
      try {
        const scraper = mapsScraperManager.getService(currentUserId);
        console.log(`[Maps Scrape] ✓ Serviço obtido, iniciando scrape...`);
        await scraper.startScrape({
          query,
          limit,
          onlyCellphones,
          excludeFixedPhones,
          onlyWithInstagramOrWhatsapp,
          onlyWithWebsite,
          minRating,
          minReviews
        });
        console.log(`[Maps Scrape] ✓ Scrape completado para ${currentUserId}`);
      } catch (err: any) {
        console.error(`[Maps Scrape] ✗ ERRO para ${currentUserId}:`, err);
        socket.emit('error', `Erro na extração: ${err.message}`);
      }
    });

    socket.on('stop-maps-scrape', () => {
      if (!currentUserId) return;
      mapsScraperManager.getService(currentUserId).stop();
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
      whatsappManager.off('status', onWhatsappStatus);
      campaignManager.off('update', onCampaignUpdate);
      campaignManager.off('log', onCampaignLog);
      mapsScraperManager.off('log', onScraperLog);
      mapsScraperManager.off('status', onScraperStatus);
      mapsScraperManager.off('item-scraped', onScraperItem);
    });
  });
};
