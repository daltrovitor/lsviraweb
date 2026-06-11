import { supabase } from '../server/utils/supabase';

async function test() {
  if (!supabase) {
    console.error('Supabase is not configured!');
    return;
  }
  console.log('Testing connection to Supabase...');
  
  try {
    const { data, error } = await supabase.from('scraped_searches').select('*').limit(10);
    if (error) {
      console.error('Error fetching scraped_searches:', error.message);
    } else {
      console.log('Data in scraped_searches:', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('Exception fetching scraped_searches:', err.message);
  }
  process.exit(0);
}

test();
