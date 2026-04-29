
-- Be Anything Adult MVP
-- Supabase/Postgres initial schema
-- v0.1 / 2026-04-22

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_year int not null check (birth_year between 1940 and 2010),
  age_band text not null check (age_band in ('40s','50s','60plus','other')),
  current_status text not null check (current_status in ('employee','self_employed','job_seeker','retiring','retired','career_break','other')),
  weekly_time_budget text not null check (weekly_time_budget in ('1_2','3_5','6_plus')),
  income_urgency text not null check (income_urgency in ('immediate','within_3_months','explore_first')),
  primary_goal text check (primary_goal in ('income','meaning','flexibility','social_contribution','learning')),
  city text,
  people_preference text check (people_preference in ('high','medium','low')),
  remote_preference text check (remote_preference in ('onsite','hybrid','remote','any')),
  physical_demand_limit text check (physical_demand_limit in ('low','medium','high','unknown')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('riasec','big_five')),
  version text not null default 'v1',
  status text not null default 'draft' check (status in ('draft','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  scores jsonb,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessment_sessions_user_id on public.assessment_sessions(user_id);

create trigger trg_assessment_sessions_updated_at
before update on public.assessment_sessions
for each row
execute function public.set_updated_at();

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  answer_value int not null check (answer_value between 1 and 5),
  created_at timestamptz not null default now(),
  unique(session_id, question_key)
);

create index if not exists idx_assessment_answers_user_id on public.assessment_answers(user_id);

create table if not exists public.exploration_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','completed')),
  ai_model text,
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exploration_sessions_user_id on public.exploration_sessions(user_id);

create trigger trg_exploration_sessions_updated_at
before update on public.exploration_sessions
for each row
execute function public.set_updated_at();

create table if not exists public.exploration_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.exploration_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_no int not null check (turn_no between 1 and 10),
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_exploration_messages_session_id on public.exploration_messages(session_id);

create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  short_description text not null,
  riasec_weights jsonb not null,
  personality_preferences jsonb not null default '{}'::jsonb,
  training_time_category text not null check (training_time_category in ('low','medium','high')),
  income_mode text check (income_mode in ('immediate','short_term','long_term','mixed')),
  remote_option text check (remote_option in ('onsite','hybrid','remote','mixed')),
  physical_demand text check (physical_demand in ('low','medium','high')),
  transition_cost_score int not null default 50 check (transition_cost_score between 0 and 100),
  demand_score int not null default 50 check (demand_score between 0 and 100),
  age_friendly_score int not null default 50 check (age_friendly_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_careers_updated_at
before update on public.careers
for each row
execute function public.set_updated_at();

create table if not exists public.career_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id uuid not null references public.careers(id) on delete cascade,
  exploration_session_id uuid references public.exploration_sessions(id) on delete set null,
  riasec_session_id uuid references public.assessment_sessions(id) on delete set null,
  bigfive_session_id uuid references public.assessment_sessions(id) on delete set null,
  rank_no smallint not null check (rank_no between 1 and 10),
  score numeric(5,2) not null,
  breakdown jsonb not null default '{}'::jsonb,
  reason_short text,
  caution_text text,
  first_action text,
  created_at timestamptz not null default now()
);

create index if not exists idx_career_recommendations_user_id on public.career_recommendations(user_id);
create index if not exists idx_career_recommendations_career_id on public.career_recommendations(career_id);

create table if not exists public.saved_careers (
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id uuid not null references public.careers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, career_id)
);

create table if not exists public.sprint_templates (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  title text not null,
  duration_days int not null default 7 check (duration_days between 3 and 14),
  overview text not null,
  tasks jsonb not null,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_sprint_templates_updated_at
before update on public.sprint_templates
for each row
execute function public.set_updated_at();

create table if not exists public.user_sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_id uuid not null references public.careers(id) on delete cascade,
  template_id uuid references public.sprint_templates(id) on delete set null,
  recommendation_id uuid references public.career_recommendations(id) on delete set null,
  status text not null default 'active' check (status in ('active','completed','paused','abandoned')),
  start_date date not null,
  end_date date not null,
  reminder_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_sprints_user_id on public.user_sprints(user_id);

create trigger trg_user_sprints_updated_at
before update on public.user_sprints
for each row
execute function public.set_updated_at();

create table if not exists public.user_sprint_tasks (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references public.user_sprints(id) on delete cascade,
  day_no int not null check (day_no between 1 and 14),
  title text not null,
  description text,
  estimated_minutes int not null default 15 check (estimated_minutes between 5 and 120),
  status text not null default 'todo' check (status in ('todo','done','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sprint_id, day_no, title)
);

create index if not exists idx_user_sprint_tasks_sprint_id on public.user_sprint_tasks(sprint_id);

create trigger trg_user_sprint_tasks_updated_at
before update on public.user_sprint_tasks
for each row
execute function public.set_updated_at();

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sprint_id uuid not null references public.user_sprints(id) on delete cascade,
  checkin_date date not null,
  completion_status text not null check (completion_status in ('done','partial','skipped')),
  confidence_score int check (confidence_score between 1 and 5),
  interest_score int check (interest_score between 1 and 5),
  note text,
  ai_feedback text,
  created_at timestamptz not null default now(),
  unique (user_id, sprint_id, checkin_date)
);

create index if not exists idx_daily_checkins_sprint_id on public.daily_checkins(sprint_id);

create table if not exists public.reflection_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sprint_id uuid not null references public.user_sprints(id) on delete cascade,
  decision text not null check (decision in ('continue','pause','reexplore')),
  barrier text,
  memo text,
  summary jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reflection_logs_sprint_id on public.reflection_logs(sprint_id);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminders_enabled boolean not null default false,
  reminder_time time,
  timezone text not null default 'Asia/Seoul',
  push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

-- RLS
alter table public.user_profiles enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.exploration_sessions enable row level security;
alter table public.exploration_messages enable row level security;
alter table public.careers enable row level security;
alter table public.career_recommendations enable row level security;
alter table public.saved_careers enable row level security;
alter table public.sprint_templates enable row level security;
alter table public.user_sprints enable row level security;
alter table public.user_sprint_tasks enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.reflection_logs enable row level security;
alter table public.notification_preferences enable row level security;

-- Profile policies
create policy "user_profiles_select_own"
on public.user_profiles for select
using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
on public.user_profiles for insert
with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
on public.user_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Assessment policies
create policy "assessment_sessions_select_own"
on public.assessment_sessions for select
using (auth.uid() = user_id);

create policy "assessment_sessions_insert_own"
on public.assessment_sessions for insert
with check (auth.uid() = user_id);

create policy "assessment_sessions_update_own"
on public.assessment_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "assessment_answers_select_own"
on public.assessment_answers for select
using (auth.uid() = user_id);

create policy "assessment_answers_insert_own"
on public.assessment_answers for insert
with check (auth.uid() = user_id);

create policy "assessment_answers_update_own"
on public.assessment_answers for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Exploration policies
create policy "exploration_sessions_select_own"
on public.exploration_sessions for select
using (auth.uid() = user_id);

create policy "exploration_sessions_insert_own"
on public.exploration_sessions for insert
with check (auth.uid() = user_id);

create policy "exploration_sessions_update_own"
on public.exploration_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "exploration_messages_select_own"
on public.exploration_messages for select
using (auth.uid() = user_id);

create policy "exploration_messages_insert_own"
on public.exploration_messages for insert
with check (auth.uid() = user_id);

-- Career public read
create policy "careers_public_read"
on public.careers for select
using (true);

create policy "sprint_templates_public_read"
on public.sprint_templates for select
using (true);

-- Recommendation policies
create policy "career_recommendations_select_own"
on public.career_recommendations for select
using (auth.uid() = user_id);

create policy "career_recommendations_insert_own"
on public.career_recommendations for insert
with check (auth.uid() = user_id);

create policy "saved_careers_select_own"
on public.saved_careers for select
using (auth.uid() = user_id);

create policy "saved_careers_insert_own"
on public.saved_careers for insert
with check (auth.uid() = user_id);

create policy "saved_careers_delete_own"
on public.saved_careers for delete
using (auth.uid() = user_id);

-- Sprint policies
create policy "user_sprints_select_own"
on public.user_sprints for select
using (auth.uid() = user_id);

create policy "user_sprints_insert_own"
on public.user_sprints for insert
with check (auth.uid() = user_id);

create policy "user_sprints_update_own"
on public.user_sprints for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_sprint_tasks_select_own"
on public.user_sprint_tasks for select
using (
  exists (
    select 1 from public.user_sprints s
    where s.id = user_sprint_tasks.sprint_id
      and s.user_id = auth.uid()
  )
);

create policy "user_sprint_tasks_insert_own"
on public.user_sprint_tasks for insert
with check (
  exists (
    select 1 from public.user_sprints s
    where s.id = user_sprint_tasks.sprint_id
      and s.user_id = auth.uid()
  )
);

create policy "user_sprint_tasks_update_own"
on public.user_sprint_tasks for update
using (
  exists (
    select 1 from public.user_sprints s
    where s.id = user_sprint_tasks.sprint_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.user_sprints s
    where s.id = user_sprint_tasks.sprint_id
      and s.user_id = auth.uid()
  )
);

-- Checkin / reflection / notification policies
create policy "daily_checkins_select_own"
on public.daily_checkins for select
using (auth.uid() = user_id);

create policy "daily_checkins_insert_own"
on public.daily_checkins for insert
with check (auth.uid() = user_id);

create policy "daily_checkins_update_own"
on public.daily_checkins for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "reflection_logs_select_own"
on public.reflection_logs for select
using (auth.uid() = user_id);

create policy "reflection_logs_insert_own"
on public.reflection_logs for insert
with check (auth.uid() = user_id);

create policy "notification_preferences_select_own"
on public.notification_preferences for select
using (auth.uid() = user_id);

create policy "notification_preferences_insert_own"
on public.notification_preferences for insert
with check (auth.uid() = user_id);

create policy "notification_preferences_update_own"
on public.notification_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
