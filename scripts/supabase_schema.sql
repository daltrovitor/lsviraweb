-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  company text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- TRIGGER FOR NEW USERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- CAMPAIGNS TABLE
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  delay_min integer default 15,
  delay_max integer default 45,
  status text default 'idle',
  stats jsonb default '{"sent": 0, "error": 0, "total": 0, "pending": 0}'::jsonb,
  automation jsonb default '{}'::jsonb,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.campaigns enable row level security;

create policy "Users can manage own campaigns"
  on campaigns for all
  using (auth.uid() = user_id);

-- CAMPAIGN CONTACTS TABLE
create table if not exists public.campaign_contacts (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  number text not null,
  name text,
  status text default 'pending',
  error_msg text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.campaign_contacts enable row level security;

create policy "Users can manage own campaign contacts"
  on campaign_contacts for all
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_contacts.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

-- SCRAPED SEARCHES
create table if not exists public.scraped_searches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  query text not null,
  target_limit integer not null,
  found_count integer default 0,
  filters jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.scraped_searches enable row level security;

create policy "Users can manage own scraped searches"
  on scraped_searches for all
  using (auth.uid() = user_id);

-- SCRAPED LEADS
create table if not exists public.scraped_leads (
  id uuid default uuid_generate_v4() primary key,
  search_id uuid references public.scraped_searches(id) on delete cascade not null,
  title text,
  address text,
  phone text,
  website text,
  rating text,
  category text,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.scraped_leads enable row level security;

create policy "Users can manage own scraped leads"
  on scraped_leads for all
  using (
    exists (
      select 1 from public.scraped_searches
      where scraped_searches.id = scraped_leads.search_id
      and scraped_searches.user_id = auth.uid()
    )
  );

-- SAVED CONTACTS
create table if not exists public.saved_contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text,
  number text not null,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, number)
);

alter table public.saved_contacts enable row level security;

create policy "Users can manage own saved contacts"
  on saved_contacts for all
  using (auth.uid() = user_id);

-- STORAGE BUCKETS (for media uploads)
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;

create policy "Users can upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.uid() = owner);

create policy "Users can view own media"
  on storage.objects for select
  using (bucket_id = 'media');
