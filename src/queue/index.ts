// src/queue/index.ts

import PQueue from 'p-queue';
import { logger } from '../lib/logger';

// Max 5 concurrent browsers (adjust as needed)
export const scrapeQueue = new PQueue({
  concurrency: 5,
  autoStart: true,
  timeout: 5 * 60 * 1000, // 5 minutes per job
});

scrapeQueue.on('error', (error) => {
  logger.error('Queue job error', error);
});

export default scrapeQueue;
