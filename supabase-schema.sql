-- Awake South Africa Database Schema
-- This file contains the database schema for migrating from localStorage to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  price_ex_vat NUMERIC(10, 2) NOT NULL,
  cost_eur NUMERIC(10, 2),
  category TEXT NOT NULL,
  category_tag TEXT,
  description TEXT,
  image TEXT,
  images JSONB,
  videos JSONB,
  badge TEXT,
  battery TEXT,
  skill_level TEXT,
  specs JSONB,
  features JSONB,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Demo locations table
CREATE TABLE IF NOT EXISTS demo_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cart items table (session-based for guest users)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Wishlist items table (session-based for guest users)
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, product_id)
);

-- Store settings table
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT DEFAULT 'Awake SA',
  email TEXT DEFAULT 'info@awakesa.co.za',
  phone TEXT DEFAULT '+27 64 575 5210',
  whatsapp TEXT DEFAULT '+27 64 575 5210',
  currency TEXT DEFAULT 'ZAR',
  tax_rate NUMERIC(5, 4) DEFAULT 0.15,
  exchange_rate NUMERIC(10, 2) DEFAULT 19.85,
  margin NUMERIC(5, 4) DEFAULT 0.35,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_demo_locations_active ON demo_locations(active);
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_session ON wishlist_items(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demo_locations_updated_at BEFORE UPDATE ON demo_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, admin write)
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Products are editable by authenticated users" ON products
    FOR ALL USING (true); -- In production, restrict to admin role

-- Demo locations policies (public read, admin write)
CREATE POLICY "Demo locations are viewable by everyone" ON demo_locations
    FOR SELECT USING (true);

CREATE POLICY "Demo locations are editable by authenticated users" ON demo_locations
    FOR ALL USING (true); -- In production, restrict to admin role

-- Cart items policies (session-based access)
CREATE POLICY "Users can view their own cart items" ON cart_items
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own cart items" ON cart_items
    FOR ALL USING (true);

-- Wishlist items policies (session-based access)
CREATE POLICY "Users can view their own wishlist items" ON wishlist_items
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own wishlist items" ON wishlist_items
    FOR ALL USING (true);

-- Store settings policies (public read, admin write)
CREATE POLICY "Store settings are viewable by everyone" ON store_settings
    FOR SELECT USING (true);

CREATE POLICY "Store settings are editable by authenticated users" ON store_settings
    FOR ALL USING (true); -- In production, restrict to admin role

-- Insert default store settings if not exists
INSERT INTO store_settings (store_name, email, phone, whatsapp, currency, tax_rate, exchange_rate, margin)
VALUES ('Awake SA', 'info@awakesa.co.za', '+27 64 575 5210', '+27 64 575 5210', 'ZAR', 0.15, 19.85, 0.35)
ON CONFLICT DO NOTHING;
