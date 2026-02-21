-- =====================================================
-- AWAKE PLATFORM - Supabase Schema
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- =====================================================

-- Drop all existing tables (clean slate) in FK-safe order
drop table if exists payment_transactions   cascade;
drop table if exists order_items            cascade;
drop table if exists orders                 cascade;
drop table if exists tenant_payment_gateways cascade;
drop table if exists payment_gateways       cascade;
drop table if exists media_files            cascade;
drop table if exists bookings               cascade;
drop table if exists customers              cascade;
drop table if exists wishlist_items         cascade;
drop table if exists cart_items             cascade;
drop table if exists store_settings         cascade;
drop table if exists demo_locations         cascade;
drop table if exists products               cascade;
drop table if exists admin_users            cascade;
drop table if exists tenants                cascade;

-- Drop old helper functions
drop function if exists update_updated_at()            cascade;
drop function if exists current_tenant_id()            cascade;
drop function if exists set_tenant_context(uuid)       cascade;
drop function if exists get_tenant_payment_gateways(uuid) cascade;

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =====================================================
-- TENANTS
-- =====================================================
create table if not exists tenants (
  id                         uuid primary key default uuid_generate_v4(),
  slug                       text unique not null,
  name                       text not null,
  domain                     text unique,
  subdomain                  text unique,
  custom_domain_verified     boolean not null default false,
  ssl_provisioned            boolean not null default false,
  logo_url                   text,
  favicon_url                text,
  primary_color              text not null default '#000000',
  secondary_color            text not null default '#ffffff',
  accent_color               text not null default '#0066ff',
  email                      text,
  phone                      text,
  whatsapp                   text,
  address                    text,
  currency                   text not null default 'ZAR',
  tax_rate                   numeric(5,4) not null default 0.15,
  timezone                   text not null default 'Africa/Johannesburg',
  medusa_store_id            text,
  cognicore_business_id      text,
  payfast_merchant_id        text,
  payfast_merchant_key       text,
  payfast_passphrase         text,
  google_drive_client_id     text,
  google_drive_client_secret text,
  google_drive_refresh_token text,
  google_drive_folder_id     text,
  google_drive_last_sync     timestamptz,
  google_drive_enabled       boolean not null default false,
  onedrive_client_id         text,
  onedrive_client_secret     text,
  onedrive_refresh_token     text,
  onedrive_folder_id         text,
  onedrive_enabled           boolean not null default false,
  is_active                  boolean not null default true,
  plan                       text not null default 'basic' check (plan in ('basic','pro','enterprise')),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

insert into tenants (slug, name, domain, subdomain, email, currency, tax_rate, plan)
values ('awake-sa','Awake South Africa','awakesa.co.za','awake-sa','info@awakesa.co.za','ZAR',0.15,'pro')
on conflict (slug) do nothing;

-- =====================================================
-- ADMIN USERS
-- =====================================================
create table if not exists admin_users (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  email         text not null,
  password_hash text not null,
  role          text not null default 'admin' check (role in ('admin','super_admin')),
  created_at    timestamptz not null default now(),
  unique (tenant_id, email)
);

-- =====================================================
-- PRODUCTS
-- =====================================================
create table if not exists products (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  name             text not null,
  slug             text,
  sku              text,
  price            numeric(10,2) not null default 0,
  price_ex_vat     numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  cost_eur         numeric(10,2),
  category         text not null default 'uncategorised',
  category_tag     text,
  description      text,
  image            text,
  images           jsonb default '[]'::jsonb,
  videos           jsonb default '[]'::jsonb,
  video_sections   jsonb default '{}'::jsonb,
  badge            text,
  battery          text,
  skill_level      text,
  specs            jsonb default '{}'::jsonb,
  features         jsonb default '[]'::jsonb,
  what_is_included jsonb default '[]'::jsonb,
  metadata         jsonb default '{}'::jsonb,
  in_stock         boolean not null default true,
  stock_quantity   integer not null default 0,
  is_active        boolean not null default true,
  is_featured      boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists products_tenant_id_idx on products(tenant_id);
create index if not exists products_category_idx  on products(tenant_id, category);
create index if not exists products_active_idx    on products(tenant_id, is_active);

-- =====================================================
-- DEMO LOCATIONS
-- =====================================================
create table if not exists demo_locations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  area        text not null,
  image       text not null,
  description text,
  price       numeric(10,2),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

insert into demo_locations (name, area, image, description, price) values
  ('V&A Waterfront',   'Cape Town',      '/images/demo/va-waterfront.svg',   'Cape Town iconic waterfront',           1500),
  ('Clifton Beach',    'Cape Town',      '/images/demo/clifton-beach.svg',   'Premier Cape Town beach',               1500),
  ('Langebaan Lagoon', 'West Coast',     '/images/demo/langebaan.svg',       'Flat calm water, great for beginners',  1200),
  ('Llandudno Beach',  'Cape Town',      '/images/demo/llandudno-beach.svg', 'Secluded Atlantic beach',               1500),
  ('Eden on the Bay',  'Bloubergstrand', '/images/demo/eden-on-the-bay.svg', 'Table Mountain backdrop, calm bay',     1500),
  ('Melkbosstrand',    'West Coast',     '/images/demo/melkbosstrand.svg',   'Wide beach with consistent conditions', 1200)
on conflict do nothing;

-- =====================================================
-- CART ITEMS
-- =====================================================
create table if not exists cart_items (
  id         uuid primary key default uuid_generate_v4(),
  session_id text not null,
  product_id uuid not null,
  name       text not null,
  price      numeric(10,2) not null,
  image      text not null,
  quantity   integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cart_items_session_idx on cart_items(session_id);

-- =====================================================
-- WISHLIST ITEMS
-- =====================================================
create table if not exists wishlist_items (
  id         uuid primary key default uuid_generate_v4(),
  session_id text not null,
  product_id uuid not null,
  name       text not null,
  price      numeric(10,2) not null,
  image      text not null,
  created_at timestamptz not null default now()
);

create index if not exists wishlist_items_session_idx on wishlist_items(session_id);

-- =====================================================
-- STORE SETTINGS
-- =====================================================
create table if not exists store_settings (
  id            uuid primary key default uuid_generate_v4(),
  store_name    text not null default 'Awake South Africa',
  email         text not null default 'info@awakesa.co.za',
  phone         text not null default '',
  whatsapp      text not null default '',
  currency      text not null default 'ZAR',
  tax_rate      numeric(5,4) not null default 0.15,
  exchange_rate numeric(8,4) not null default 19.85,
  margin        numeric(5,4) not null default 0.30,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into store_settings (store_name, email, currency, tax_rate, exchange_rate, margin)
values ('Awake South Africa', 'info@awakesa.co.za', 'ZAR', 0.15, 19.85, 0.30)
on conflict do nothing;

-- =====================================================
-- PAYMENT GATEWAYS (master list)
-- =====================================================
create table if not exists payment_gateways (
  id                   uuid primary key default uuid_generate_v4(),
  code                 text unique not null,
  name                 text not null,
  description          text,
  logo_url             text,
  is_active            boolean not null default true,
  supported_currencies text[] not null default array['ZAR'],
  documentation_url    text,
  created_at           timestamptz not null default now()
);

insert into payment_gateways (code, name, description, supported_currencies, documentation_url) values
  ('payfast', 'PayFast',        'SA gateway: EFT, cards, instant EFT',    array['ZAR'],                  'https://developers.payfast.co.za/'),
  ('yoco',    'Yoco',           'SA card payment gateway for businesses',  array['ZAR'],                  'https://developer.yoco.com/'),
  ('peach',   'Peach Payments', 'Full-stack SA payment gateway',           array['ZAR','USD','EUR'],      'https://developer.peachpayments.com/'),
  ('ikhokha', 'iKhokha',        'SA mobile payment solution',              array['ZAR'],                  'https://developer.ikhokha.com/'),
  ('stripe',  'Stripe',         'Global gateway for international sales',  array['USD','EUR','GBP','ZAR'],'https://stripe.com/docs')
on conflict (code) do nothing;

-- =====================================================
-- TENANT PAYMENT GATEWAYS (per-tenant credentials)
-- =====================================================
create table if not exists tenant_payment_gateways (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  gateway_id    uuid not null references payment_gateways(id) on delete cascade,
  credentials   jsonb not null default '{}'::jsonb,
  is_enabled    boolean not null default false,
  is_default    boolean not null default false,
  is_sandbox    boolean not null default true,
  display_order integer not null default 0,
  webhook_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, gateway_id)
);

create index if not exists tpg_tenant_idx on tenant_payment_gateways(tenant_id);

-- Seed PayFast sandbox for Awake SA (replace with real credentials in admin)
insert into tenant_payment_gateways (tenant_id, gateway_id, credentials, is_enabled, is_default, is_sandbox, display_order)
select t.id, pg.id,
  '{"merchant_id":"10000100","merchant_key":"46f0cd694581a","passphrase":""}'::jsonb,
  false, true, true, 1
from tenants t, payment_gateways pg
where t.slug = 'awake-sa' and pg.code = 'payfast'
on conflict (tenant_id, gateway_id) do nothing;

-- =====================================================
-- ORDERS
-- =====================================================
create table if not exists orders (
  id                 uuid primary key default uuid_generate_v4(),
  tenant_id          uuid references tenants(id),
  order_number       text unique not null,
  customer_id        uuid,
  customer_email     text not null,
  customer_phone     text,
  subtotal           numeric(10,2) not null default 0,
  tax_amount         numeric(10,2) not null default 0,
  shipping_amount    numeric(10,2) not null default 0,
  discount_amount    numeric(10,2) not null default 0,
  total              numeric(10,2) not null default 0,
  currency           text not null default 'ZAR',
  shipping_address   jsonb not null default '{}'::jsonb,
  billing_address    jsonb not null default '{}'::jsonb,
  payment_method     text not null default 'payfast',
  payment_reference  text,
  status             text not null default 'pending'     check (status in ('pending','processing','shipped','delivered','cancelled','refunded')),
  payment_status     text not null default 'unpaid'      check (payment_status in ('unpaid','paid','failed','refunded')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled','fulfilling','fulfilled','returned')),
  paid_at            timestamptz,
  shipped_at         timestamptz,
  tracking_number    text,
  tracking_url       text,
  admin_notes        text,
  customer_notes     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_tenant_idx         on orders(tenant_id);
create index if not exists orders_email_idx          on orders(customer_email);
create index if not exists orders_status_idx         on orders(status);
create index if not exists orders_payment_status_idx on orders(payment_status);

-- =====================================================
-- ORDER ITEMS
-- =====================================================
create table if not exists order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid,
  product_name text not null,
  quantity     integer not null default 1,
  unit_price   numeric(10,2) not null,
  total_price  numeric(10,2) not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx on order_items(order_id);

-- =====================================================
-- PAYMENT TRANSACTIONS
-- =====================================================
create table if not exists payment_transactions (
  id             uuid primary key default uuid_generate_v4(),
  order_id       uuid not null references orders(id) on delete cascade,
  gateway        text not null,
  transaction_id text not null,
  amount         numeric(10,2) not null,
  currency       text not null default 'ZAR',
  status         text not null default 'pending',
  metadata       jsonb default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists payment_tx_order_idx on payment_transactions(order_id);

-- =====================================================
-- CUSTOMERS
-- =====================================================
create table if not exists customers (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid references tenants(id),
  email         text not null,
  first_name    text,
  last_name     text,
  phone         text,
  whatsapp      text,
  address       jsonb default '{}'::jsonb,
  total_orders  integer not null default 0,
  total_spent   numeric(10,2) not null default 0,
  last_order_at timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, email)
);

create index if not exists customers_tenant_idx on customers(tenant_id);
create index if not exists customers_email_idx  on customers(email);

-- =====================================================
-- BOOKINGS (demo rides / test sessions)
-- =====================================================
create table if not exists bookings (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid references tenants(id),
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  location       text not null,
  booking_date   date not null,
  booking_time   text not null,
  duration_mins  integer not null default 60,
  participants   integer not null default 1,
  total_price    numeric(10,2) not null default 0,
  status         text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  payment_status text not null default 'unpaid'  check (payment_status in ('unpaid','paid','refunded')),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists bookings_tenant_idx on bookings(tenant_id);
create index if not exists bookings_date_idx   on bookings(booking_date);

-- =====================================================
-- MEDIA FILES
-- =====================================================
create table if not exists media_files (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid references tenants(id),
  name          text not null,
  url           text not null,
  type          text not null check (type in ('image','video','document')),
  size_bytes    bigint,
  mime_type     text,
  source        text default 'upload' check (source in ('upload','google-drive','onedrive')),
  drive_id      text,
  thumbnail_url text,
  alt_text      text,
  tags          text[] default array[]::text[],
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists media_tenant_idx on media_files(tenant_id);
create index if not exists media_type_idx   on media_files(tenant_id, type);

-- =====================================================
-- UPDATED_AT AUTO-TRIGGER
-- =====================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'tenants','products','orders','order_items','bookings','customers',
    'cart_items','wishlist_items','store_settings','tenant_payment_gateways',
    'media_files','demo_locations'
  ] loop
    execute format(
      'drop trigger if exists %I on %I;
       create trigger %I before update on %I
       for each row execute function update_updated_at();',
      tbl||'_updated_at', tbl, tbl||'_updated_at', tbl
    );
  end loop;
end;
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table tenants                 enable row level security;
alter table products                enable row level security;
alter table orders                  enable row level security;
alter table order_items             enable row level security;
alter table bookings                enable row level security;
alter table customers               enable row level security;
alter table tenant_payment_gateways enable row level security;
alter table media_files             enable row level security;
alter table admin_users             enable row level security;
alter table demo_locations          enable row level security;

alter table cart_items       disable row level security;
alter table wishlist_items   disable row level security;
alter table store_settings   disable row level security;
alter table payment_gateways disable row level security;

create or replace function current_tenant_id()
returns uuid language sql stable as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid;
$$;

create policy "products_sel" on products for select using (tenant_id = current_tenant_id() or current_tenant_id() is null);
create policy "products_ins" on products for insert with check (tenant_id = current_tenant_id());
create policy "products_upd" on products for update using (tenant_id = current_tenant_id());
create policy "products_del" on products for delete using (tenant_id = current_tenant_id());

create policy "orders_sel" on orders for select using (tenant_id = current_tenant_id() or current_tenant_id() is null);
create policy "orders_ins" on orders for insert with check (true);
create policy "orders_upd" on orders for update using (tenant_id = current_tenant_id() or current_tenant_id() is null);

create policy "tenants_sel" on tenants for select using (true);
create policy "tenants_upd" on tenants for update using (id = current_tenant_id());

create policy "demo_sel" on demo_locations for select using (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
create or replace function set_tenant_context(tenant_id uuid)
returns void language sql as $$
  select set_config('app.tenant_id', tenant_id::text, true);
$$;

create or replace function get_tenant_payment_gateways(p_tenant_id uuid)
returns table (gateway_code text, gateway_name text, is_default boolean, is_sandbox boolean)
language sql stable as $$
  select pg.code, pg.name, tpg.is_default, tpg.is_sandbox
  from tenant_payment_gateways tpg
  join payment_gateways pg on pg.id = tpg.gateway_id
  where tpg.tenant_id = p_tenant_id
    and tpg.is_enabled = true
  order by tpg.display_order;
$$;

-- =====================================================
-- DONE: 15 tables, RLS, triggers, helper functions
-- Tables: tenants, admin_users, products, demo_locations,
--   cart_items, wishlist_items, store_settings,
--   payment_gateways, tenant_payment_gateways,
--   orders, order_items, payment_transactions,
--   customers, bookings, media_files
-- =====================================================
