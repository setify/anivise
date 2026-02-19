import { getOrgLocations } from '../actions'
import { LocationsClient } from './locations-client'

export default async function LocationsPage() {
  const locations = await getOrgLocations()

  return <LocationsClient locations={locations} />
}
