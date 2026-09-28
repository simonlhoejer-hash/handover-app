-- Nulstil kun tidligere registreringer fra Messen.
-- Øvrige spildregistreringer og gæstetal bevares.
delete from public.food_waste_entries
where location_name like 'Messen %';
