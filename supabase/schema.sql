create table if not exists app_settings (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists test_cases (
  id text primary key,
  name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_templates (
  id text primary key,
  name text not null,
  is_active boolean not null default true,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_settings (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists runs (
  id text primary key,
  mode text not null,
  label text not null,
  status text not null default 'running',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists variant_results (
  id text primary key,
  run_id text not null references runs(id) on delete cascade,
  model text not null,
  variant_label text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists ratings (
  id text primary key,
  run_id text not null references runs(id) on delete cascade,
  variant_result_id text,
  comparison_key text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists source_pool (
  id text primary key,
  import_batch_id text not null,
  name text not null,
  organization_name text,
  team_name text,
  organization_uuid text,
  is_verified boolean not null default false,
  organization_type text not null,
  team_activity text,
  team_affiliation text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists source_pool_verified_idx on source_pool (is_verified);
