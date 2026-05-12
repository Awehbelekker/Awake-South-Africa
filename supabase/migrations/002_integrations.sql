-- Migration 002: Tenant integrations (email, WhatsApp) + inbound message store
-- Run this in Supabase SQL editor or via `supabase db push`

-- ── 1. Add email_config and whatsapp_config columns to tenants ───────────────
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS email_config     jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_config  jsonb DEFAULT NULL;

COMMENT ON COLUMN tenants.email_config IS
  'Tenant email provider settings: {provider, sender_name, sender_email, reply_to, smtp_*, api_key}';

COMMENT ON COLUMN tenants.whatsapp_config IS
  'Tenant WhatsApp settings: {phone_number, provider, twilio_*, meta_*, template_*}';

-- ── 2. WhatsApp inbound message log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  direction     text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number   text,
  to_number     text,
  body          text,
  provider      text CHECK (provider IN ('twilio', 'meta')),
  provider_id   text,                        -- Twilio SID or Meta message ID
  status        text DEFAULT 'received',     -- received / read / failed
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_tenant_idx   ON whatsapp_messages (tenant_id);
CREATE INDEX IF NOT EXISTS whatsapp_messages_from_idx     ON whatsapp_messages (from_number);
CREATE INDEX IF NOT EXISTS whatsapp_messages_created_idx  ON whatsapp_messages (created_at DESC);

-- ── 3. RLS: service role only (webhooks run server-side) ─────────────────────
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON whatsapp_messages
  FOR ALL USING (auth.role() = 'service_role');
