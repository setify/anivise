import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { getEmailLayoutConfig } from '@/lib/email/send'
import { EmailTemplatesClient } from './email-templates-client'

export default async function EmailTemplatesPage() {
  const currentUser = await requirePlatformRole('superadmin')
  const templates = await db
    .select()
    .from(emailTemplates)
    .orderBy(desc(emailTemplates.isSystem))

  const layoutConfig = await getEmailLayoutConfig()

  return (
    <EmailTemplatesClient
      templates={templates}
      currentUser={currentUser}
      layoutConfig={layoutConfig}
    />
  )
}
