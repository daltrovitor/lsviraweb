// src/services/mapsScraper.ts

import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import scrapeQueue from '../queue';
import { getIO } from '../socket/io';

/**
 * Interface describing a single scrape request.
 */
export interface ScrapeRequest {
  userId: string; // Supabase user ID
  query: string; // Search query (e.g., "coffee shops in São Paulo")
  limit?: number; // Max number of results to collect
}

/**
 * Internal helper that performs the actual Puppeteer scraping.
 * This runs inside a queue job so concurrency is limited.
 */
async function performScrape(request: ScrapeRequest): Promise<any[]> {
  const { userId, query, limit = 50 } = request;
  const io = getIO();
  const room = `user:${userId}`;

  let browser: Browser | null = null;
  try {
    logger.info({ userId, query }, 'Starting Google Maps scrape');
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Emit progress updates via socket
    io.to(room).emit('scrape-progress', { status: 'loaded', progress: 0 });

    // Simple example: collect place cards visible on the first page
    const results = await page.evaluate((max) => {
      const cards = Array.from(document.querySelectorAll('[role="article"]'));
      return cards.slice(0, max).map((card) => {
        const titleEl = card.querySelector('h1, h2, h3, span') as HTMLElement | null;
        const subtitleEl = card.querySelector('span:nth-child(2)') as HTMLElement | null;
        return {
          name: titleEl?.innerText || null,
          address: subtitleEl?.innerText || null,
        };
      });
    }, limit);

    logger.info({ userId, count: results.length }, 'Scrape completed');
    io.to(room).emit('scrape-progress', { status: 'complete', progress: 100, resultsCount: results.length });
    return results;
  } catch (error) {
    logger.error({ userId, error }, 'Scrape job failed');
    io.to(room).emit('scrape-error', { error: (error as Error).message });
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Public function to enqueue a new scrape job.
 * Returns a job ID (the internal queue's task id) that can be used for tracking.
 */
export async function enqueueScrape(request: ScrapeRequest): Promise<string> {
  const jobId = `scrape-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // Persist a pending record in Supabase for later UI reference
  await supabase.from('maps_scrapes').insert({
    id: jobId,
    user_id: request.userId,
    query: request.query,
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  // Add the actual scraping work to the queue
  await scrapeQueue.add(async () => {
    // Update status to running
    await supabase
      .from('maps_scrapes')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', jobId);
    try {
      const results = await performScrape(request);
      // Store results (simplified – you may create a separate table for rows)
      await supabase.from('maps_scrapes').update({ status: 'completed', results: results as any, completed_at: new Date().toISOString() }).eq('id', jobId);
    } catch (err) {
      await supabase.from('maps_scrapes').update({ status: 'failed', error: (err as Error).message }).eq('id', jobId);
    }
  });

  return jobId;
}
