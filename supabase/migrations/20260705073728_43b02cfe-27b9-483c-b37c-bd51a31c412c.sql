
-- Phone verification for WhatsApp assistant (n8n)
create or replace function public.normalize_phone(p text) returns text
language sql immutable as $$
  select case when p is null then null else regexp_replace(p, '[^0-9]', '', 'g') end;
$$;

alter table public.profiles add column if not exists phone_verified_at timestamptz;
alter table public.profiles add column if not exists phone_normalized text
  generated always as (public.normalize_phone(phone)) stored;

create index if not exists profiles_phone_normalized_idx on public.profiles(phone_normalized) where phone_verified_at is not null;

create table if not exists public.phone_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_normalized text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists pvc_user_idx on public.phone_verification_codes(user_id, created_at desc);

grant select, insert, update on public.phone_verification_codes to authenticated;
grant all on public.phone_verification_codes to service_role;

alter table public.phone_verification_codes enable row level security;

drop policy if exists "own verification codes" on public.phone_verification_codes;
create policy "own verification codes" on public.phone_verification_codes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
