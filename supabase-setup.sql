-- EMKT Zittex: tabla propia en el proyecto compartido wa8crm.
-- Prefijo emkt_ para no chocar con nada del CRM de WhatsApp.

create table if not exists emkt_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS activado sin policies: bloquea las claves publishable/anon por completo.
-- El backend usa la service_role key, que siempre bypassea RLS.
alter table emkt_data enable row level security;
