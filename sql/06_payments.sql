-- =============================================================================
--  TinyRide v3 schema — 06 · Payments, webhooks, ledger, payouts
--
--  Money is stored as integer minor units (paise) — never numeric(10,2) — and
--  every row carries its currency. The ledger is append-only double-entry-lite:
--  each financial event writes balanced entries against named accounts, so
--  reconciliation (PRD business metric) is a query, not a spreadsheet.
-- =============================================================================

set search_path = public, extensions;

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid references public.bookings(id) on delete restrict,
  subscription_id     uuid references public.subscriptions(id) on delete restrict,
  parent_id           uuid not null references public.parents(id) on delete restrict,
  provider            text not null default 'razorpay',
  provider_order_id   text,
  provider_payment_id text,
  amount_minor        bigint not null check (amount_minor >= 0),
  currency            char(3) not null default 'INR',
  period_start        date,
  period_end          date,
  status              text not null default 'created',
  status_domain       text generated always as ('payment') stored,
  failure_code        text,
  captured_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint fk_payments_status foreign key (status_domain, status)
    references public.states(domain, code),
  constraint chk_payments_subject check (booking_id is not null or subscription_id is not null),
  constraint chk_payments_period check (period_end is null or period_start is null
                                        or period_end >= period_start)
);
create unique index uq_payments_order on public.payments(provider, provider_order_id)
  where provider_order_id is not null;
create unique index uq_payments_provider_payment on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;
create index idx_payments_booking on public.payments(booking_id);
create index idx_payments_subscription on public.payments(subscription_id);
create index idx_payments_parent on public.payments(parent_id, created_at desc);
create index idx_payments_status on public.payments(status) where status <> 'captured';
create trigger payments_updated_at before update on public.payments
  for each row execute function app.set_updated_at();

-- Webhooks are authoritative and idempotent: the unique provider_event_id makes
-- a replay a no-op insert, and processing state is tracked explicitly so a
-- failed handler can be retried without double-applying.
create table public.payment_webhooks (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null default 'razorpay',
  provider_event_id  text not null,
  event_type         text not null,
  signature_verified boolean not null default false,
  payload            jsonb not null default '{}'::jsonb,
  payment_id         uuid references public.payments(id) on delete set null,
  received_at        timestamptz not null default now(),
  processed_at       timestamptz,
  processing_error   text,
  attempts           int not null default 0,
  unique (provider, provider_event_id)
);
create index idx_webhooks_unprocessed on public.payment_webhooks(received_at)
  where processed_at is null;
create index idx_webhooks_event_type on public.payment_webhooks(event_type);

create table public.ledger_accounts (
  id           uuid primary key default gen_random_uuid(),
  account_type ledger_account_type not null,
  parent_id    uuid references public.parents(id) on delete restrict,
  owner_id     uuid references public.vehicle_owners(id) on delete restrict,
  currency     char(3) not null default 'INR',
  created_at   timestamptz not null default now(),
  constraint chk_ledger_account_subject check (
    (account_type = 'parent_receivable' and parent_id is not null and owner_id is null) or
    (account_type = 'owner_payable'     and owner_id  is not null and parent_id is null) or
    (account_type in ('platform_revenue','gateway_clearing','cash')
       and parent_id is null and owner_id is null)
  )
);
create unique index uq_ledger_account_parent on public.ledger_accounts(parent_id, currency)
  where parent_id is not null;
create unique index uq_ledger_account_owner on public.ledger_accounts(owner_id, currency)
  where owner_id is not null;
create unique index uq_ledger_account_house on public.ledger_accounts(account_type, currency)
  where parent_id is null and owner_id is null;

-- A transaction groups the balanced entries of one financial event.
create table public.ledger_transactions (
  id             uuid primary key default gen_random_uuid(),
  entry_type     ledger_entry_type not null,
  currency       char(3) not null default 'INR',
  payment_id     uuid references public.payments(id) on delete restrict,
  payout_id      uuid,                                  -- FK added after payouts
  booking_id     uuid references public.bookings(id) on delete restrict,
  provider_ref   text,                                  -- refund id, UTR, ...
  description    text,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index idx_ledger_tx_payment on public.ledger_transactions(payment_id);
create index idx_ledger_tx_created on public.ledger_transactions(created_at desc);

create table public.ledger_entries (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transactions(id) on delete restrict,
  account_id     uuid not null references public.ledger_accounts(id) on delete restrict,
  -- Signed: debit > 0, credit < 0. Entries of one transaction must sum to zero.
  amount_minor   bigint not null check (amount_minor <> 0),
  currency       char(3) not null default 'INR',
  created_at     timestamptz not null default now()
);
create index idx_ledger_entries_tx on public.ledger_entries(transaction_id);
create index idx_ledger_entries_account on public.ledger_entries(account_id, created_at desc);

-- Append-only: corrections are new reversing transactions, never edits.
create trigger ledger_tx_append_only before update or delete on public.ledger_transactions
  for each row execute function app.forbid_mutation();
create trigger ledger_entries_append_only before update or delete on public.ledger_entries
  for each row execute function app.forbid_mutation();

-- Balanced-transaction check, deferred to commit so entries can be inserted one
-- by one inside the same transaction.
create or replace function app.assert_ledger_balanced()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sum bigint;
begin
  select coalesce(sum(amount_minor),0) into v_sum
    from public.ledger_entries where transaction_id = new.transaction_id;
  if v_sum <> 0 then
    raise exception 'Ledger transaction % is unbalanced by % minor units',
      new.transaction_id, v_sum using errcode = 'check_violation';
  end if;
  return null;
end; $$;

create constraint trigger ledger_balanced
  after insert on public.ledger_entries
  deferrable initially deferred
  for each row execute function app.assert_ledger_balanced();

create table public.payouts (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.vehicle_owners(id) on delete restrict,
  period_start   date not null,
  period_end     date not null,
  gross_minor    bigint not null check (gross_minor >= 0),
  fee_minor      bigint not null default 0 check (fee_minor >= 0),
  net_minor      bigint not null check (net_minor >= 0),
  currency       char(3) not null default 'INR',
  status         text not null default 'pending',
  status_domain  text generated always as ('payout') stored,
  provider_transfer_id text,
  approved_by    uuid references public.profiles(id) on delete set null,
  approved_at    timestamptz,
  paid_at        timestamptz,
  failure_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint fk_payouts_status foreign key (status_domain, status)
    references public.states(domain, code),
  constraint chk_payout_period check (period_end >= period_start),
  constraint chk_payout_net check (net_minor = gross_minor - fee_minor),
  unique (owner_id, period_start, period_end)
);
create index idx_payouts_owner on public.payouts(owner_id, period_start desc);
create index idx_payouts_status on public.payouts(status) where status <> 'paid';
create trigger payouts_updated_at before update on public.payouts
  for each row execute function app.set_updated_at();

alter table public.ledger_transactions
  add constraint fk_ledger_tx_payout foreign key (payout_id)
  references public.payouts(id) on delete restrict;

-- Idempotency for all money-moving API calls (PRD: idempotency requirement).
create table public.idempotency_keys (
  key            text primary key,
  user_id        uuid references public.profiles(id) on delete set null,
  endpoint       text not null,
  request_hash   text not null,
  response_body  jsonb,
  status_code    int,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '24 hours'
);
create index idx_idempotency_expiry on public.idempotency_keys(expires_at);
