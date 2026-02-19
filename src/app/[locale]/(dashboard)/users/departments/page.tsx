import { getOrgDepartments } from '../actions'
import { DepartmentsClient } from './departments-client'

export default async function DepartmentsPage() {
  const departments = await getOrgDepartments()

  return <DepartmentsClient departments={departments} />
}
