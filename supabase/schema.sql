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
