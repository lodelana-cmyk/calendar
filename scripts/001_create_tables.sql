-- Editorial Studio Database Schema

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'Content Creator',
  avatar_url text,
  timezone text default 'America/New_York',
  is_online boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  category text not null default 'DEVELOPMENT',
  lead_id uuid references public.profiles(id) on delete set null,
  icon_label text not null default '',
  icon_color text not null default 'bg-indigo-500',
  status text not null default 'Active' check (status in ('Active', 'On Hold', 'Completed', 'Archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "projects_select_all" on public.projects for select using (true);
create policy "projects_insert_authenticated" on public.projects for insert with check (auth.uid() is not null);
create policy "projects_update_authenticated" on public.projects for update using (auth.uid() is not null);
create policy "projects_delete_authenticated" on public.projects for delete using (auth.uid() is not null);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  task_type text not null default 'Edit',
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Blocked', 'Done')),
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "tasks_select_all" on public.tasks for select using (true);
create policy "tasks_insert_authenticated" on public.tasks for insert with check (auth.uid() is not null);
create policy "tasks_update_authenticated" on public.tasks for update using (auth.uid() is not null);
create policy "tasks_delete_authenticated" on public.tasks for delete using (auth.uid() is not null);

-- Project members (many-to-many)
create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, profile_id)
);

alter table public.project_members enable row level security;

create policy "project_members_select_all" on public.project_members for select using (true);
create policy "project_members_insert_authenticated" on public.project_members for insert with check (auth.uid() is not null);
create policy "project_members_delete_authenticated" on public.project_members for delete using (auth.uid() is not null);

-- Archived projects table
create table if not exists public.archived_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  category text not null,
  campaign_cycle text not null,
  delivered_on date,
  tags text[] default '{}',
  storage_gb numeric(10,2) default 0,
  impressions integer default 0,
  lead_name text,
  cover_image_url text,
  created_at timestamptz default now()
);

alter table public.archived_projects enable row level security;

create policy "archived_projects_select_all" on public.archived_projects for select using (true);
create policy "archived_projects_insert_authenticated" on public.archived_projects for insert with check (auth.uid() is not null);

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'Content Creator')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Indexes for better query performance
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_assignee_id on public.tasks(assignee_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_lead_id on public.projects(lead_id);
