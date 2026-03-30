-- Subscription records synced from RevenueCat webhooks.
-- This is the durable billing log; profiles.is_premium is a mirrored summary field.

create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  -- RevenueCat identifiers
  rc_original_app_user_id text not null,
  rc_event_id           text unique,           -- idempotency key (RevenueCat event id)
  product_id            text not null,
  entitlement_id        text not null default 'premium',
  -- Status
  status                text not null          -- 'active' | 'expired' | 'cancelled' | 'refunded'
    check (status in ('active', 'expired', 'cancelled', 'refunded')),
  -- Lifecycle timestamps from RevenueCat
  purchase_date         timestamp with time zone,
  expiration_date       timestamp with time zone,
  cancelled_at          timestamp with time zone,
  -- Metadata from webhook payload
  store                 text,                  -- 'APP_STORE' | 'PLAY_STORE' | 'STRIPE'
  environment           text,                  -- 'PRODUCTION' | 'SANDBOX'
  raw_event             jsonb,                 -- full RevenueCat event for audit
  -- Record timestamps
  created_at            timestamp with time zone default now(),
  updated_at            timestamp with time zone default now()
);

-- Index for fast user lookup
create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

-- Index for idempotency check in webhook handler
create unique index if not exists subscriptions_rc_event_id_idx
  on public.subscriptions (rc_event_id)
  where rc_event_id is not null;

-- RLS: users can read their own subscriptions; writes only via service role (webhook)
alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated role → only service role can write
-- This ensures client code cannot manipulate billing records directly.

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
