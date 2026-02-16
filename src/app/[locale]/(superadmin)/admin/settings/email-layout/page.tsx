import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { redirect } from 'next/navigation'
import { getEmailLayoutConfig } from '@/lib/email/send'
import { EmailLayoutPageClient } from './email-layout-client'

export default async function EmailLayoutPage() {
  const user = await requirePlatformRole('superadmin')
  if (!user) redirect('/admin')

  const config = await getEmailLayoutConfig()

  return <EmailLayoutPageClient config={config} />
}
