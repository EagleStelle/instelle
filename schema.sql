-- Run this in your Supabase SQL editor

create table notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  "order" integer default 0 not null,
  created_at timestamptz default now() not null
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  notebook_id uuid references notebooks(id) on delete cascade not null,
  title text not null,
  created_at timestamptz default now() not null
);

create table pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  note_id uuid references notes(id) on delete cascade not null,
  title text not null,
  content text default '' not null,
  "order" integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index notes_notebook_id_idx on notes(notebook_id);
create index pages_note_id_idx on pages(note_id);
create index notebooks_user_order_idx on notebooks(user_id, "order");

-- Row Level Security
alter table notebooks enable row level security;
alter table notes enable row level security;
alter table pages enable row level security;

create policy "users own notebooks"
  on notebooks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users own notes"
  on notes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users own pages"
  on pages for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- If notebooks already exists in your project, run this migration manually:
-- alter table notebooks add column if not exists "order" integer default 0 not null;
-- with ranked as (
--   select id, row_number() over (partition by user_id order by created_at) - 1 as rn
--   from notebooks
-- )
-- update notebooks n
-- set "order" = r.rn
-- from ranked r
-- where n.id = r.id;
-- create index if not exists notebooks_user_order_idx on notebooks(user_id, "order");
