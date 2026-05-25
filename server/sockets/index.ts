import { Server } from 'socket.io';
import { whatsappService } from '../services/whatsapp';
import { campaignService } from '../services/campaign';
import { Campaign } from '../types';
import { mapsScraperService } from '../services/maps-scraper';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Enviar status atual ao conectar
    socket.emit('whatsapp-status', whatsappService.getStatus());

    // Handlers para eventos para poder removê-los no disconnect e evitar vazamento de memória
    const onWhatsappStatus = (status: any) => {
      socket.emit('whatsapp-status', status);
    };

    const onCampaignUpdate = (campaign: any) => {
      socket.emit('campaign-update', campaign);
    };

    const onCampaignLog = (message: any) => {
      socket.emit('log', { message, timestamp: new Date() });
    };

    // Escutar eventos do WhatsApp Service
    whatsappService.on('status', onWhatsappStatus);

    // Escutar eventos da Campanha
    campaignService.on('update', onCampaignUpdate);
    campaignService.on('log', onCampaignLog);

    // Escutar eventos do Scraper
    const onScraperLog = (msg: string) => socket.emit('maps-log', { message: msg, timestamp: new Date() });
    const onScraperStatus = (status: string) => socket.emit('maps-status', status);
    const onScraperItem = (data: any) => socket.emit('maps-item-scraped', data);

    mapsScraperService.on('log', onScraperLog);
    mapsScraperService.on('status', onScraperStatus);
    mapsScraperService.on('item-scraped', onScraperItem);

    socket.on('start-campaign', async (campaign: Campaign) => {
      try {
        await campaignService.startCampaign(campaign);
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });

    socket.on('pause-campaign', () => {
      campaignService.pause();
    });

    socket.on('resume-campaign', () => {
      campaignService.resume();
    });

    socket.on('stop-campaign', () => {
      campaignService.stop();
    });

    socket.on('get-groups', async (callback) => {
      try {
        const groups = await whatsappService.getGroups();
        if(callback) callback({ success: true, data: groups });
      } catch (error: any) {
        if(callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('get-group-members', async (groupId: string, callback) => {
      try {
        const members = await whatsappService.getGroupMembers(groupId);
        if(callback) callback({ success: true, data: members });
      } catch (error: any) {
        if(callback) callback({ success: false, error: error.message });
      }
    });

    socket.on('whatsapp-logout', async () => {
      await whatsappService.logout();
    });

    socket.on('start-maps-scrape', async ({ query, limit, onlyCellphones, excludeFixedPhones, onlyWithInstagramOrWhatsapp }) => {
      try {
        await mapsScraperService.startScrape({
          query,
          limit,
          onlyCellphones,
          excludeFixedPhones,
          onlyWithInstagramOrWhatsapp
        });
      } catch (err: any) {
        socket.emit('error', err.message);
      }
    });

    socket.on('stop-maps-scrape', () => {
      mapsScraperService.stop();
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
      whatsappService.off('status', onWhatsappStatus);
      campaignService.off('update', onCampaignUpdate);
      campaignService.off('log', onCampaignLog);
      mapsScraperService.off('log', onScraperLog);
      mapsScraperService.off('status', onScraperStatus);
      mapsScraperService.off('item-scraped', onScraperItem);
    });
  });
};
