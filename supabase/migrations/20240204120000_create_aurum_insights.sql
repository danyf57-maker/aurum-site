create table if not exists public.aurum_insights (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  last_entry_ts bigint not null,
  summary       text not null,
  micro_action  text not null,
  model         text not null default 'deepseek-chat',
  tokens_in     integer,
  tokens_out    integer,
  created_at    timestamptz not null default now()
);

create index if not exists aurum_insights_user_idx
  on public.aurum_insights(user_id, last_entry_ts desc);
