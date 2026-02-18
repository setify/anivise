import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { listMedia } from './actions'
import { MediaPageClient } from './media-page-client'

export default async function MediaPage() {
  await requirePlatformRole('superadmin')
  const { data: files } = await listMedia()

  return <MediaPageClient initialFiles={files ?? []} />
}
