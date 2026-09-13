-- FoodDash: Supabase Auth + roles + partner status + secure admin account management.
-- Run this migration in Supabase SQL Editor BEFORE using the production auth flow.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('customer','restaurant','delivery','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.account_status as enum ('active','inactive','pending','suspended');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.restaurant_status as enum ('pending','approved','suspended');
exception when duplicate_object then null; end $$;


create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text not null default '',
  role public.app_role not null default 'customer',
  status public.account_status not null default 'active',
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  owner_email text not null,
  phone text default '',
  status public.restaurant_status not null default 'pending',
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text default '',
  status text not null default 'offline' check (status in ('offline','available','on_delivery')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  category text not null default 'Other',
  offer text,
  is_veg boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  type text not null check (type in ('credit','debit','withdrawal','refund')),
  amount numeric(12,2) not null check (amount >= 0),
  order_id uuid,
  tag text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('bank','upi')),
  status text not null default 'pending' check (status in ('pending','processed','paid','failed','reverted')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  failure_reason text
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references auth.users(id) on delete cascade,
  against_user_id uuid references auth.users(id) on delete set null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_review','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin') $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id,name,email,phone,role,status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role,'customer'::public.app_role),
    'active'::public.account_status
  ) on conflict (id) do update set email=excluded.email;
  insert into public.user_roles(user_id,role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::public.app_role,'customer'::public.app_role))
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- If an admin suspends a restaurant, auth login is blocked by the profile status check in the app.
create or replace function public.admin_set_restaurant_status(p_restaurant_id uuid, p_status public.restaurant_status)
returns void language plpgsql security definer set search_path = public
as $$
declare v_owner uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select owner_id into v_owner from public.restaurants where id = p_restaurant_id;
  if v_owner is null then raise exception 'Restaurant not found'; end if;
  update public.restaurants set status=p_status, updated_at=now() where id=p_restaurant_id;
  update public.profiles set status = case when p_status='approved' then 'active'::public.account_status when p_status='suspended' then 'suspended'::public.account_status else 'pending'::public.account_status end, updated_at=now() where id=v_owner;
end; $$;

create or replace function public.admin_list_users()
returns table(id uuid,name text,email text,phone text,role public.app_role,status public.account_status,created_at timestamptz)
language sql security definer set search_path=public
as $$ select p.id,p.name,p.email,p.phone,p.role,p.status,p.created_at from public.profiles p where public.is_admin() order by p.created_at desc $$;

create or replace function public.admin_set_user_status(p_user_id uuid,p_status public.account_status)
returns void language plpgsql security definer set search_path=public
as $$ begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update public.profiles set status=p_status,updated_at=now() where id=p_user_id;
end; $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.restaurants enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.menu_items enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists profiles_self_or_admin on public.profiles;
create policy profiles_self_or_admin on public.profiles for select using (id=auth.uid() or public.is_admin());
drop policy if exists roles_self_or_admin on public.user_roles;
create policy roles_self_or_admin on public.user_roles for select using (user_id=auth.uid() or public.is_admin());
drop policy if exists restaurants_owner_or_admin on public.restaurants;
create policy restaurants_owner_or_admin on public.restaurants for select using (owner_id=auth.uid() or public.is_admin());
drop policy if exists delivery_self_or_admin on public.delivery_partners;
create policy delivery_self_or_admin on public.delivery_partners for select using (user_id=auth.uid() or public.is_admin());
drop policy if exists menu_owner_or_admin on public.menu_items;
create policy menu_owner_or_admin on public.menu_items for all using (public.is_admin() or exists(select 1 from public.restaurants r where r.id=menu_items.restaurant_id and r.owner_id=auth.uid())) with check (public.is_admin() or exists(select 1 from public.restaurants r where r.id=menu_items.restaurant_id and r.owner_id=auth.uid()));
drop policy if exists wallet_owner_or_admin on public.wallet_transactions;
create policy wallet_owner_or_admin on public.wallet_transactions for select using (user_id=auth.uid() or public.is_admin());
drop policy if exists withdrawal_owner_or_admin on public.withdrawal_requests;
create policy withdrawal_owner_or_admin on public.withdrawal_requests for select using (user_id=auth.uid() or public.is_admin());
drop policy if exists tickets_participant_or_admin on public.support_tickets;
create policy tickets_participant_or_admin on public.support_tickets for select using (opened_by=auth.uid() or against_user_id=auth.uid() or public.is_admin());
drop policy if exists messages_participant_or_admin on public.support_messages;
create policy messages_participant_or_admin on public.support_messages for select using (sender_id=auth.uid() or public.is_admin() or exists(select 1 from public.support_tickets t where t.id=support_messages.ticket_id and (t.opened_by=auth.uid() or t.against_user_id=auth.uid())));

-- Never store plaintext passwords in public.profiles or any app table.
-- Supabase Auth stores password hashes securely. Admin uses reset email, not password viewing.
