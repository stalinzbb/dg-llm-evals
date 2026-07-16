create table if not exists app_settings (
  id text primary key,
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

create table if not exists evals (
  id text primary key,
  name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists datasets (
  id text primary key,
  name text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table runs add column if not exists eval_id text;

-- Legacy tables from the fundraiser-specific era (test_cases, prompt_templates,
-- source_pool) are no longer used. Existing installs can drop them:
--   drop table if exists test_cases;
--   drop table if exists prompt_templates;
--   drop table if exists source_pool;
