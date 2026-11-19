-- Supabase Schema for Trusted Choice OMS

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Products Table
create table products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  sku text not null,
  barcode text not null,
  category text not null,
  supplier_id text not null,
  purchase_price numeric not null,
  sale_price numeric not null,
  stock integer not null,
  low_stock_threshold integer not null,
  warranty_months integer,
  image_url text,
  description text,
  status text not null,
  created_at timestamp with time zone default now()
);

alter table products enable row level security;
create policy "Authenticated users can manage products" on products
  for all to authenticated using (true) with check (true);
create policy "Anyone can see products" on products
  for select using (true);

-- 2. Customers Table
create table customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) default auth.uid(),
  name text not null,
  phone text not null,
  address text,
  join_date timestamp with time zone default now()
);

alter table customers enable row level security;
create policy "Authenticated users can manage customers" on customers
  for all to authenticated using (true) with check (true);
create policy "Anyone can create a customer" on customers
  for insert with check (true);

-- 3. Orders Table
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  order_number text not null,
  date timestamp with time zone default now(),
  customer_id text not null,
  items jsonb not null,
  subtotal numeric not null,
  discount numeric not null,
  total numeric not null,
  payment_method text not null,
  benefit_pay_ref text,
  employee_id text not null,
  delivery_fee numeric,
  status text not null
);

alter table orders enable row level security;
create policy "Authenticated users can manage orders" on orders
  for all to authenticated using (true) with check (true);

-- 4. Expenses Table
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  date timestamp with time zone default now(),
  category text not null,
  description text not null,
  amount numeric not null,
  order_id text
);

alter table expenses enable row level security;
create policy "Authenticated users can manage expenses" on expenses
  for all to authenticated using (true) with check (true);

-- 5. Suppliers Table
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  contact_person text not null,
  phone text not null,
  email text,
  created_at timestamp with time zone default now()
);

alter table suppliers enable row level security;
create policy "Authenticated users can manage suppliers" on suppliers
  for all to authenticated using (true) with check (true);

-- 6. Drivers Table
create table drivers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null
);

alter table drivers enable row level security;
create policy "Authenticated users can manage drivers" on drivers
  for all to authenticated using (true) with check (true);

-- 7. Deliveries Table
create table deliveries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  order_id text not null,
  customer_id text not null,
  address text not null,
  status text not null,
  delivery_date timestamp with time zone,
  driver_id text,
  estimated_delivery_time timestamp with time zone,
  current_location jsonb,
  route jsonb
);

alter table deliveries enable row level security;
create policy "Authenticated users can manage deliveries" on deliveries
  for all to authenticated using (true) with check (true);

-- 8. Users/Profiles Table
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null,
  permissions jsonb not null,
  status text not null,
  image_url text,
  created_at timestamp with time zone default now()
);

alter table users enable row level security;
create policy "Users can view and edit their own profiles" on users
  for all using (auth.uid() = id);
create policy "Authenticated users can view all profiles" on users
  for select to authenticated using (true);

-- 9. Purchase Orders
create table purchase_orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  po_number text not null,
  date timestamp with time zone default now(),
  supplier_id text not null,
  items jsonb not null,
  total_amount numeric not null,
  status text not null
);

alter table purchase_orders enable row level security;
create policy "Authenticated users can manage POs" on purchase_orders
  for all to authenticated using (true) with check (true);

-- 10. Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  message_key text not null,
  message_params jsonb,
  read boolean default false,
  date timestamp with time zone default now(),
  screen text not null,
  related_id text
);

alter table notifications enable row level security;
create policy "Authenticated users can manage notifications" on notifications
  for all to authenticated using (true) with check (true);

-- 11. Requests
create table requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) default auth.uid(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  date timestamp with time zone default now(),
  items jsonb not null,
  status text not null
);

alter table requests enable row level security;
create policy "Authenticated users can manage requests" on requests
  for all to authenticated using (true) with check (true);
create policy "Anyone can create a request" on requests
  for insert with check (true);
