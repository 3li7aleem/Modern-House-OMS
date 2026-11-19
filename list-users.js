import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xnfgiczucmwmrtambplg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZmdpY3p1Y213bXJ0YW1icGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzAyNzMsImV4cCI6MjA5NDcwNjI3M30.fML08c-WWF8kFitAYI-FMUjvTKu49l4QdCn90kWbWmo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function run() {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) console.error(error);
    else console.log(users);
}
run();
