-- Rename the station in existing food-waste data.
-- Safe to run more than once: after the first run, no rows match the old name.

begin;

update public.food_waste_entries
set location_name = 'Produktion Varm Galley'
where location_name = 'Produktion Main Galley';

commit;

-- Verification: old_name_count should be 0.
select
  count(*) filter (where location_name = 'Produktion Main Galley') as old_name_count,
  count(*) filter (where location_name = 'Produktion Varm Galley') as renamed_row_count
from public.food_waste_entries;
