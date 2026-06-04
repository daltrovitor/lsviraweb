import { Server } from 'socket.io';
import { whatsappManager } from '../services/whatsapp';
import { campaignManager } from '../services/campaign';
import { Campaign } from '../types';
import { mapsScraperManager } from '../services/maps-scraper';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket) => {
    let currentUserId: string | null = null;
    console.log('Cliente conectado:', socket.id);

    // Registro do Socket ao Usuário
    socket.on('register', (userId: string) => {
      console.log(`Socket ${socket.id} registrado para usuário: ${userId}`);
      currentUserId = userId;
      // Enviar status atual ao conectar
      const waService = whatsappManager.getService(userId);
      socket.emit('whatsapp-status', waService.getStatus());
    });

    socket.on('get-whatsapp-status', () => {
      if (currentUserId) {
        const waService = whatsappManager.getService(currentUserId);
        socket.emit('whatsapp-status', waService.getStatus());
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
