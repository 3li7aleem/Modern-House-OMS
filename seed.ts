import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xnfgiczucmwmrtambplg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZmdpY3p1Y213bXJ0YW1icGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzAyNzMsImV4cCI6MjA5NDcwNjI3M30.fML08c-WWF8kFitAYI-FMUjvTKu49l4QdCn90kWbWmo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const kitchenProducts = [
  {
    name: "Modern Stainless Steel Sink",
    sku: "SINK-001",
    barcode: "1234567890123",
    category: "Sinks",
    supplier_id: "SUP-01",
    purchase_price: 150,
    sale_price: 250,
    stock: 20,
    low_stock_threshold: 5,
    status: "Active",
    image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop"
  },
  {
    name: "Luxury Double Bowl Sink",
    sku: "SINK-002",
    barcode: "1234567890124",
    category: "Sinks",
    supplier_id: "SUP-01",
    purchase_price: 200,
    sale_price: 320,
    stock: 15,
    low_stock_threshold: 3,
    status: "Active",
    image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop" // You can replace with another sink image
  },
  {
    name: "Gas Stove 4 Burners",
    sku: "STOVE-001",
    barcode: "1234567890125",
    category: "Stoves",
    supplier_id: "SUP-02",
    purchase_price: 300,
    sale_price: 450,
    stock: 10,
    low_stock_threshold: 2,
    status: "Active",
    image_url: "https://images.unsplash.com/photo-1556697015-181cdca732a6?q=80&w=1470&auto=format&fit=crop"
  },
  {
    name: "Electric Induction Stove",
    sku: "STOVE-002",
    barcode: "1234567890126",
    category: "Stoves",
    supplier_id: "SUP-02",
    purchase_price: 250,
    sale_price: 380,
    stock: 12,
    low_stock_threshold: 2,
    status: "Active",
    image_url: "https://images.unsplash.com/photo-1556697015-181cdca732a6?q=80&w=1470&auto=format&fit=crop" // replace if needed
  },
  {
    name: "Smart Microwave Oven",
    sku: "MW-001",
    barcode: "1234567890127",
    category: "Microwaves",
    supplier_id: "SUP-03",
    purchase_price: 120,
    sale_price: 199,
    stock: 30,
    low_stock_threshold: 5,
    status: "Active",
    image_url: "https://images.unsplash.com/photo-1585659722983-38ca84b551ac?q=80&w=1470&auto=format&fit=crop"
  },
  {
    name: "Compact Microwave 20L",
    sku: "MW-002",
    barcode: "1234567890128",
    category: "Microwaves",
    supplier_id: "SUP-03",
    purchase_price: 80,
    sale_price: 125,
    stock: 25,
    low_stock_threshold: 5,
    status: "Active",
    image_url: "https://images.unsplash.com/photo-1585659722983-38ca84b551ac?q=80&w=1470&auto=format&fit=crop"
  }
];

async function seed() {
  const email = `seed_${Math.random().toString(36).substring(7)}@example.com`;
  const password = 'Password123!';
  
  console.log("Signing up user:", email);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password
  });
  
  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }
  
  console.log("User id:", authData.user?.id);
  
  for (const product of kitchenProducts) {
    const { data, error } = await supabase.from('products').insert(product);
    if (error) {
       console.error("Insert error for", product.name, error);
    } else {
       console.log("Inserted:", product.name);
    }
  }
}

seed();
