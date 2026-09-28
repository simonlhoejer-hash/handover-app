import { getSupabaseAdmin } from './supabaseServer'
import { defaultFoodWasteStations, withCurrentMessStations, type FoodWasteStation } from './foodWasteStationConfig'

export async function getConfiguredFoodWasteStations(ship: 'crown' | 'pearl'): Promise<FoodWasteStation[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('food_waste_station_config')
    .select('stations')
    .eq('vessel', ship)
    .maybeSingle()
  if (error || !Array.isArray(data?.stations) || data.stations.length === 0) return defaultFoodWasteStations(ship)
  return withCurrentMessStations(data.stations as FoodWasteStation[], ship)
}
