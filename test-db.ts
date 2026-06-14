import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'apps/api/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumns() {
  const { data, error } = await supabase.from('media').select('*').limit(1);
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No data found, cannot infer columns.');
  }
}

checkColumns();
