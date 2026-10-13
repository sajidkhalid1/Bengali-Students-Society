-- Run once in the private Supabase SQL editor. Never expose the service-role key.
create table if not exists public.bss_members (
  id uuid primary key,
  full_name text not null,
  email text not null,
  student_id_encrypted text not null,
  student_lookup text not null,
  access_hash text unique not null,
  plan text not null check (plan in ('new', 'returning')),
  membership_year text not null default '2026-2027',
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked', 'expired')),
  expires_at timestamptz not null,
  checkout_session_id text unique,
  payment_intent_id text,
  created_at timestamptz not null default now()
);
alter table public.bss_members enable row level security;
revoke all on public.bss_members from anon, authenticated;
create unique index if not exists bss_active_student on public.bss_members(student_lookup, membership_year) where status = 'active';

create or replace function public.reserve_bss_membership(member_id uuid, member_name text, member_email text, member_plan text, encrypted_student_id text, student_lookup text, access_digest text, membership_expiry timestamptz)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(student_lookup, 0));
  if exists (select 1 from bss_members m where m.student_lookup = reserve_bss_membership.student_lookup and m.membership_year = '2026-2027' and m.status in ('active', 'pending')) then return false; end if;
  insert into bss_members(id, full_name, email, plan, student_id_encrypted, student_lookup, access_hash, expires_at)
  values(member_id, member_name, member_email, member_plan, encrypted_student_id, student_lookup, access_digest, membership_expiry);
  return true;
end $$;
revoke all on function public.reserve_bss_membership(uuid,text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_bss_membership(uuid,text,text,text,text,text,text,timestamptz) to service_role;

-- Email delivery metadata is server-only, protected by the table's existing RLS.
alter table public.bss_members add column if not exists card_email_claimed_at timestamptz;
alter table public.bss_members add column if not exists card_email_accepted_at timestamptz;
alter table public.bss_members add column if not exists card_email_provider_id text;

create or replace function public.claim_bss_card_email(member_id uuid)
returns setof public.bss_members language sql security definer set search_path = public as $$
  update public.bss_members m set card_email_claimed_at = now()
  where m.id = member_id and m.status = 'active' and m.expires_at > now()
    and m.card_email_accepted_at is null
    and (m.card_email_claimed_at is null or m.card_email_claimed_at < now() - interval '2 minutes')
  returning m.*;
$$;
revoke all on function public.claim_bss_card_email(uuid) from public, anon, authenticated;
grant execute on function public.claim_bss_card_email(uuid) to service_role;
