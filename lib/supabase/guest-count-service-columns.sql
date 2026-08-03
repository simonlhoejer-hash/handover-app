-- Separate guest counts by the buffet service they belong to.
-- Safe to run more than once.

alter table public.food_waste_guest_counts
  add column if not exists skagerak_morning integer,
  add column if not exists commodore_morning integer,
  add column if not exists skagerak_evening integer,
  add column if not exists mess_guests integer;

alter table public.food_waste_guest_counts
  drop constraint if exists food_waste_guest_counts_skagerak_morning_check,
  add constraint food_waste_guest_counts_skagerak_morning_check
    check (skagerak_morning is null or skagerak_morning between 0 and 10000),
  drop constraint if exists food_waste_guest_counts_commodore_morning_check,
  add constraint food_waste_guest_counts_commodore_morning_check
    check (commodore_morning is null or commodore_morning between 0 and 10000),
  drop constraint if exists food_waste_guest_counts_skagerak_evening_check,
  add constraint food_waste_guest_counts_skagerak_evening_check
    check (skagerak_evening is null or skagerak_evening between 0 and 10000),
  drop constraint if exists food_waste_guest_counts_mess_guests_check,
  add constraint food_waste_guest_counts_mess_guests_check
    check (mess_guests is null or mess_guests between 0 and 10000);

comment on column public.food_waste_guest_counts.skagerak_morning is 'Guests at the Skagerak breakfast buffet';
comment on column public.food_waste_guest_counts.commodore_morning is 'Guests at the Commodore breakfast buffet';
comment on column public.food_waste_guest_counts.skagerak_evening is 'Guests at the Skagerak evening buffet';
comment on column public.food_waste_guest_counts.mess_guests is 'Estimated crew mess guests per meal';
