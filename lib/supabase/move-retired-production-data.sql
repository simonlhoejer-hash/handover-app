-- Flyt historiske food-waste-registreringer fra udgåede produktionssteder
-- til Produktion Skagerak Galley. Scriptet kan køres flere gange uden skade.

begin;

update public.food_waste_entries
set location_name = 'Produktion Skagerak Galley'
where location_name = 'Produktion Kold Galley';

update public.food_waste_entries
set location_name = 'Produktion Proviant'
where location_name = 'Produktion Proviant dæk 1';

commit;

-- Kontrol: De gamle navne skal begge vise 0.
select
  location_name,
  count(*) as antal
from public.food_waste_entries
where location_name in (
  'Produktion Kold Galley',
  'Produktion Proviant dæk 1'
)
group by location_name;
