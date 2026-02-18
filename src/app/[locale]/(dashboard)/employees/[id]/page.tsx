import { notFound } from 'next/navigation'
import { getEmployeeById, getManagerOptions } from '../actions'
import { getOrgDepartments, getOrgLocations } from '../../users/actions'
import { EmployeeDetailClient } from './employee-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params

  const [employee, departments, locations, managers] = await Promise.all([
    getEmployeeById(id),
    getOrgDepartments(),
    getOrgLocations(),
    getManagerOptions(),
  ])

  if (!employee) notFound()

  return (
    <EmployeeDetailClient
      employee={employee}
      departments={departments}
      locations={locations}
      managers={managers}
    />
  )
}
