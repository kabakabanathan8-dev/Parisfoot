-- GLOBAL BET — schéma de démonstration Supabase
-- Exécuter dans Supabase > SQL Editor.
-- Ce schéma n'active AUCUN dépôt, retrait ou pari avec argent réel.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.demo_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  selections jsonb not null default '[]'::jsonb,
  stake_virtual integer not null check (stake_virtual >= 0),
  potential_virtual integer not null check (potential_virtual >= 0),
  status text not null default 'demo' check (status = 'demo'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.demo_tickets enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can update own display name" on public.profiles;
create policy "Users can update own display name" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can read own demo tickets" on public.demo_tickets;
create policy "Users can read own demo tickets" on public.demo_tickets
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can create own demo tickets" on public.demo_tickets;
create policy "Users can create own demo tickets" on public.demo_tickets
  for insert to authenticated with check (auth.uid() = user_id and status = 'demo');

-- Création automatique d'un profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANT : ne changez jamais le rôle d'un utilisateur depuis le navigateur.
-- Pour désigner un administrateur, faites-le depuis l'éditeur SQL du projet,
-- en remplaçant l'adresse e-mail par celle du compte que VOUS contrôlez :
-- update public.profiles p set role = 'admin'
-- from auth.users u where p.id = u.id and u.email = 'votre-email@example.com';
-- Une véritable interface d'administration nécessitera ensuite des contrôles serveur
-- et des politiques RLS supplémentaires. Ne publiez jamais de clé service_role.
