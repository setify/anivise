'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Eye, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { endImpersonationAction } from '@/app/[locale]/(dashboard)/impersonation-actions'

interface Props {
  orgId: string
  orgName: string
  role: string
}

export function ImpersonationBanner({ orgId, orgName, role }: Props) {
  const t = useTranslations('admin.impersonation')
  const locale = useLocale()
  const router = useRouter()

  async function handleEnd() {
    await endImpersonationAction()
    router.push(`/${locale}/admin/organizations/${orgId}`)
  }

  return (
    <div className="bg-amber-500 text-amber-950 relative z-50 flex items-center justify-between gap-4 px-4 py-2 text-sm font-medium">
      <div className="flex items-center gap-2">
        <Eye className="size-4" />
        <span>
          {t('banner', { orgName, role })}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEnd}
        className="border-amber-700 bg-amber-600 text-amber-950 hover:bg-amber-700 h-7 text-xs"
      >
        <ArrowLeft className="mr-1 size-3" />
        {t('endImpersonation')}
      </Button>
    </div>
  )
}
