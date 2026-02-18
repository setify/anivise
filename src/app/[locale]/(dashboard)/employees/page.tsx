import {
  getEmployees,
  getEmployeeStats,
  getManagerOptions,
} from './actions'
import { getOrgDepartments, getOrgLocations } from '../users/actions'
import { EmployeesPageClient } from './employees-page-client'

export default async function EmployeesPage() {
  const [employees, stats, departments, locations, managers] = await Promise.all([
    getEmployees(),
    getEmployeeStats(),
    getOrgDepartments(),
    getOrgLocations(),
    getManagerOptions(),
  ])

  return (
    <EmployeesPageClient
      employees={employees}
      stats={stats}
      departments={departments}
      locations={locations}
      managers={managers}
    />
  )
}
