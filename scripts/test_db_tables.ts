import { supabase } from '../server/utils/supabase';

async function test() {
  if (!supabase) {
    console.error('Supabase is not configured!');
    return;
  }
  console.log('Testing connection to Supabase...');
  
  const tables = ['map_searches', 'maps_searches', 'scraped_searches', 'scraped_leads'];
  for (const t of tables) {
    try {
      const { data, error, status } = await supabase.from(t).select('id').limit(1);
      if (error) {
        console.log(`Table "${t}": FAILED (status ${status}) - Error:`, error.message);
      } else {
        console.log(`Table "${t}": SUCCESS (status ${status}) - Data:`, data);
      }
    } catch (err: any) {
      console.log(`Table "${t}": THREW EXCEPTION - Error:`, err.message);
    }
  }
}

test();
