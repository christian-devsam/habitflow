-- ================================================================
-- HabitFlow AI — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ================================================================

-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own_profile" on public.profiles for all using (auth.uid() = id);

-- Auto-create profile al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  insert into public.commitment_fund (user_id) values (new.id);
  insert into public.user_context (user_id) values (new.id);
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text default '⭐',
  category text default 'health',
  color text default '#3b82f6',
  schedule jsonb not null default '{"time":"08:00","days":["mon","tue","wed","thu","fri"],"pre_habit_reminder":false,"pre_habit_message":""}',
  levels jsonb not null default '{"minimum":{"duration":5,"description":"Versión mínima","points":10},"ideal":{"duration":30,"description":"Versión ideal","points":25},"elite":{"duration":60,"description":"Versión elite","points":50}}',
  current_difficulty_level text default 'ideal',
  environment_setup_status text default 'pending',
  streak_resilience_points integer default 50,
  current_streak integer default 0,
  best_streak integer default 0,
  commitment_contribution integer default 10,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.habits enable row level security;
create policy "own_habits" on public.habits for all using (auth.uid() = user_id);

-- Daily logs
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  completed boolean not null,
  level_completed text,
  emergency_mode boolean default false,
  justification text,
  points_earned integer default 0,
  created_at timestamptz default now(),
  unique(habit_id, date)
);
alter table public.daily_logs enable row level security;
create policy "own_logs" on public.daily_logs for all using (auth.uid() = user_id);

-- Commitment fund
create table if not exists public.commitment_fund (
  user_id uuid references auth.users on delete cascade primary key,
  balance integer default 500,
  total_earned integer default 0,
  total_lost integer default 0,
  updated_at timestamptz default now()
);
alter table public.commitment_fund enable row level security;
create policy "own_fund" on public.commitment_fund for all using (auth.uid() = user_id);

-- Commitment transactions
create table if not exists public.commitment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  habit_id uuid references public.habits on delete set null,
  date date not null default current_date,
  amount integer not null,
  reason text,
  created_at timestamptz default now()
);
alter table public.commitment_transactions enable row level security;
create policy "own_transactions" on public.commitment_transactions for all using (auth.uid() = user_id);

-- User context + integraciones
create table if not exists public.user_context (
  user_id uuid references auth.users on delete cascade primary key,
  busy_level text default 'normal',
  energy_level integer default 70,
  google_access_token text,
  google_refresh_token text,
  google_token_expiry timestamptz,
  push_subscription jsonb,
  updated_at timestamptz default now()
);
alter table public.user_context enable row level security;
create policy "own_context" on public.user_context for all using (auth.uid() = user_id);
