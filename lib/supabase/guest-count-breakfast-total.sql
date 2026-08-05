-- One combined breakfast guest count for both ships.
-- Safe to run more than once.

alter table public.food_waste_guest_counts
  add column if not exists breakfast_guests integer;

alter table public.food_waste_guest_counts
  drop constraint if exists food_waste_guest_counts_breakfast_guests_check,
  add constraint food_waste_guest_counts_breakfast_guests_check
    check (breakfast_guests is null or breakfast_guests between 0 and 10000);

-- Preserve existing history by combining the two former breakfast fields.
update public.food_waste_guest_counts
set breakfast_guests = coalesce(skagerak_morning, 0) + coalesce(commodore_morning, 0)
where breakfast_guests is null
  and (skagerak_morning is not null or commodore_morning is not null);

comment on column public.food_waste_guest_counts.breakfast_guests
  is 'Combined breakfast guest count';
