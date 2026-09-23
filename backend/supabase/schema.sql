-- ============================================================
-- Expense Tracker — Supabase schema
-- Run this in the Supabase SQL editor for your project.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- USERS ----------
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  mobile_number text not null unique,
  pin_hash text not null,
  created_at timestamptz default now()
);

-- ---------- EXPENSE CATEGORIES (per user, seeded with defaults on signup) ----------
create table if not exists expense_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- ---------- EXPENSES ----------
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  amount numeric not null,
  category text not null,
  note text,
  expense_date date not null default current_date,
  source text not null default 'manual' check (source in ('manual','group_settlement')),
  source_ref_id uuid,
  created_at timestamptz default now()
);

-- ---------- GROUP EXPENSES ----------

create table if not exists friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  mobile_number text,
  created_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists activity_members (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid references activities(id) on delete cascade,
  friend_id uuid references friends(id) on delete cascade,
  created_at timestamptz default now(),
  unique (activity_id, friend_id)
);

-- Every group cost AND every settlement payment lives in this one ledger.
-- type='expense': amount is split equally across every activity member + the account owner.
-- type='settlement': a direct payer -> receiver transfer that isn't split.
create table if not exists activity_payments (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid references activities(id) on delete cascade,
  type text not null default 'expense' check (type in ('expense','settlement')),
  amount numeric not null,
  reason text,
  payer_type text not null check (payer_type in ('user','friend')),
  payer_friend_id uuid references friends(id),
  receiver_type text check (receiver_type in ('user','friend', null)),
  receiver_friend_id uuid references friends(id),
  paid_at date not null default current_date,
  created_at timestamptz default now()
);
