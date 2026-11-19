import { createClient } from "@supabase/supabase-js";

// We use the anon key and URL from .env.example
const SUPABASE_URL = "https://xnfgiczucmwmrtambplg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZmdpY3p1Y213bXJ0YW1icGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzAyNzMsImV4cCI6MjA5NDcwNjI3M30.fML08c-WWF8kFitAYI-FMUjvTKu49l4QdCn90kWbWmo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBackend() {
  console.log("Testing Supabase Database...");

  // 1. Sign up a test user to respect RLS (Row Level Security)
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "securepassword123";

  console.log(`\nCreating test user: ${testEmail}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error("Failed to create test user:", authError.message);
    return;
  }
  console.log("Test user created successfully! UID:", authData.user.id);
  
  // Sign in to get session
  const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
  });
  if (signInError) {
      console.log("Sign in error:", signInError);
      return;
  }

  // 2. Insert some products
  console.log("\nAdding products...");
  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .insert([
      {
        name: "Test Laptop X1",
        sku: "LAP-X1-001",
        barcode: "100000001",
        category: "Electronics",
        supplier_id: "test-supplier",
        purchase_price: 800,
        sale_price: 1200,
        stock: 10,
        low_stock_threshold: 3,
        status: "Active"
      },
      {
        name: "Wireless Mouse Pro",
        sku: "MOU-PRO-002",
        barcode: "100000002",
        category: "Accessories",
        supplier_id: "test-supplier",
        purchase_price: 25,
        sale_price: 50,
        stock: 150,
        low_stock_threshold: 20,
        status: "Active"
      }
    ])
    .select();

  if (productsError) {
    console.error("Failed to add products:", productsError.message);
  } else {
    console.log("Successfully added products:", productsData.map(p => p.name));
  }

  // 3. Insert some customers
  console.log("\nAdding customers...");
  const { data: customersData, error: customersError } = await supabase
    .from("customers")
    .insert([
      {
        name: "Alice Johnson",
        phone: "+1 555-0101",
        address: "742 Evergreen Terrace"
      },
      {
        name: "Bob Smith",
        phone: "+1 555-0202",
        address: "123 Fake Street"
      }
    ])
    .select();

  if (customersError) {
    console.error("Failed to add customers:", customersError.message);
  } else {
    console.log("Successfully added customers:", customersData.map(c => c.name));
  }

  console.log("\nBackend tests complete! You can view these entries in your Supabase Dashboard.");
}

testBackend();
