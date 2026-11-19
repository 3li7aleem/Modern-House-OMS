import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xnfgiczucmwmrtambplg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZmdpY3p1Y213bXJ0YW1icGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzAyNzMsImV4cCI6MjA5NDcwNjI3M30.fML08c-WWF8kFitAYI-FMUjvTKu49l4QdCn90kWbWmo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function addUser(user) {
    const randomPassword = user.password;
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: randomPassword
    });
    
    if (authError) {
        if (authError.message === 'User already registered') {
            console.log(`User ${user.email} is already registered in auth system. You should edit them from the UI or run a script to update their role.`);
            return;
        }
        console.error("Auth error:", authError);
        return;
    }

    if (!authData.user) {
        console.error("No user returned");
        return;
    }

    const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status
    });

    if (profileError) {
        console.error("Profile error:", profileError);
    } else {
        console.log(`Added ${user.name} (${user.email}) successfully. password: ${randomPassword}`);
    }
}

async function run() {
    await addUser({
        name: 'Manager',
        email: 'manager@admin.com',
        role: 'Admin',
        password: 'AdminPassword2026!',
        permissions: ['dashboard', 'orders', 'pos', 'inventory', 'finance', 'customers', 'suppliers', 'delivery', 'requests', 'purchaseOrders', 'reports', 'users', 'settings'],
        status: 'Active'
    });
}

run();
