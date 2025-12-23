create extension if not exists "pgcrypto";

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date date not null,
  time time not null,
  created_at timestamp with time zone default timezone('utc', now())
);

create unique index if not exists bookings_room_slot_idx on public.bookings (room_id, date, time);
create index if not exists bookings_date_idx on public.bookings (date);

insert into public.rooms (name)
values
  ('Sala Caracas'),
  ('Sala Beirut'),
  ('Sala Aruba'),
  ('Cabina Mallorca'),
  ('Cabina Miami'),
  ('Cabina Bogota'),
  ('Cabina London'),
  ('Cabina CDMX')
on conflict (name) do nothing;

