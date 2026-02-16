import { AppShell } from '@/components/layout/app-shell'
import { getImpersonation } from '@/lib/auth/impersonation'
import { ImpersonationBanner } from '@/components/layout/impersonation-banner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const impersonation = await getImpersonation()

  return (
    <>
      {impersonation && (
        <ImpersonationBanner
          orgId={impersonation.orgId}
          orgName={impersonation.orgName}
          role={impersonation.role}
        />
      )}
      <AppShell>{children}</AppShell>
    </>
  )
}
