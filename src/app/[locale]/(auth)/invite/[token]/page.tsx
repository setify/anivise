import { validateInviteToken } from './actions'
import { InviteClient } from './invite-client'

interface InvitePageProps {
  params: Promise<{ token: string; locale: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token, locale } = await params
  const result = await validateInviteToken(token)

  return <InviteClient result={result} token={token} locale={locale} />
}
