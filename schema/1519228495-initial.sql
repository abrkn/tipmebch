create domain amount as decimal(28, 8);

create table account (
  account_id text primary key,
  created_at timestamptz not null default (now()),
  balance amount not null check (balance >= 0)
);

create table deposit (
  deposit_id serial primary key,
  created_at timestamptz not null default (now()),
  account_id text not null references account(account_id),
  amount amount not null check(amount > 0),
  txid text not null check(length(txid) = 64),
  output_index int not null check(output_index >= 0)
);

create table withdraw (
  withdraw_id serial primary key,
  created_at timestamptz not null default (now()),
  account_id text not null references account(account_id),
  amount amount not null check(amount > 0),
  txid text not null check(length(txid) = 64)
);

create table transfer (
  transfer_id serial primary key,
  created_at timestamptz not null default (now()),
  from_account_id text not null references account(account_id),
  to_account_id text not null references account(account_id) check (from_account_id <> to_account_id),
  amount amount not null check(amount > 0)
);

create function transfer_insert_trigger() returns trigger as $$
begin
  update account
  set balance = balance - NEW.amount
  where account_id = NEW.from_account_id;

  update account
  set balance = balance + NEW.amount
  where account_id = NEW.to_account_id;
end; $$ language plpgsql;
