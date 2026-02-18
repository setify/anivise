import { redirect } from 'next/navigation'
import { getOrgGeneralData } from './actions'
import { SettingsGeneralClient } from './settings-general-client'

export default async function SettingsGeneralPage() {
  const data = await getOrgGeneralData()
  if (!data) redirect('/dashboard')
  return <SettingsGeneralClient data={data} />
}
