'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { saveOrgNotificationSettings, type NotificationSettingsData } from './actions'
import type { NotificationSettingKey } from '@/lib/notifications/should-notify'

interface NotificationRow {
  key: NotificationSettingKey
  labelKey: string
  descriptionKey: string
}

const GROUPS: Array<{
  titleKey: string
  rows: NotificationRow[]
}> = [
  {
    titleKey: 'groupLimits',
    rows: [
      { key: 'notifyLimitWarning80', labelKey: 'limitWarning80', descriptionKey: 'limitWarning80Desc' },
      { key: 'notifyLimitReached100', labelKey: 'limitReached100', descriptionKey: 'limitReached100Desc' },
    ],
  },
  {
    titleKey: 'groupAnalyses',
    rows: [
      { key: 'notifyAnalysisCompleted', labelKey: 'analysisCompleted', descriptionKey: 'analysisCompletedDesc' },
      { key: 'notifyAnalysisFailed', labelKey: 'analysisFailed', descriptionKey: 'analysisFailedDesc' },
    ],
  },
  {
    titleKey: 'groupTeam',
    rows: [
      { key: 'notifyMemberJoined', labelKey: 'memberJoined', descriptionKey: 'memberJoinedDesc' },
      { key: 'notifyMemberLeft', labelKey: 'memberLeft', descriptionKey: 'memberLeftDesc' },
      { key: 'notifyInvitationExpired', labelKey: 'invitationExpired', descriptionKey: 'invitationExpiredDesc' },
    ],
  },
  {
    titleKey: 'groupForms',
    rows: [
      { key: 'notifyFormSubmission', labelKey: 'formSubmission', descriptionKey: 'formSubmissionDesc' },
      { key: 'notifyFormAssigned', labelKey: 'formAssigned', descriptionKey: 'formAssignedDesc' },
    ],
  },
  {
    titleKey: 'groupSystem',
    rows: [
      { key: 'notifyPlanChanged', labelKey: 'planChanged', descriptionKey: 'planChangedDesc' },
      { key: 'notifyMaintenance', labelKey: 'maintenance', descriptionKey: 'maintenanceDesc' },
    ],
  },
]

interface Props {
  data: NotificationSettingsData
}

export function NotificationsClient({ data }: Props) {
  const t = useTranslations('org.settings.notifications')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()

  const initValues = () => ({
    notifyLimitWarning80: data.settings.notifyLimitWarning80,
    notifyLimitReached100: data.settings.notifyLimitReached100,
    notifyAnalysisCompleted: data.settings.notifyAnalysisCompleted,
    notifyAnalysisFailed: data.settings.notifyAnalysisFailed,
    notifyMemberJoined: data.settings.notifyMemberJoined,
    notifyMemberLeft: data.settings.notifyMemberLeft,
    notifyInvitationExpired: data.settings.notifyInvitationExpired,
    notifyFormSubmission: data.settings.notifyFormSubmission,
    notifyFormAssigned: data.settings.notifyFormAssigned,
    notifyPlanChanged: data.settings.notifyPlanChanged,
    notifyMaintenance: data.settings.notifyMaintenance,
  })

  const [values, setValues] = useState<Record<NotificationSettingKey, boolean>>(initValues)

  function toggle(key: NotificationSettingKey) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveOrgNotificationSettings(values)
      if (result.success) {
        toast.success(t('saveSuccess'))
      } else {
        toast.error(result.error ?? tc('error'))
      }
    })
  }

  const updatedAt = data.settings.updatedAt
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.titleKey}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t(group.titleKey)}
            </h2>
            <div className="overflow-hidden rounded-lg border">
              {group.rows.map((row, i) => (
                <div key={row.key}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-sm font-medium">{t(row.labelKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(row.descriptionKey)}</p>
                    </div>
                    <Switch
                      checked={values[row.key]}
                      onCheckedChange={() => toggle(row.key)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {formattedDate && data.updatedByName && (
        <p className="text-xs text-muted-foreground">
          {t('lastChanged', { name: data.updatedByName, date: formattedDate })}
        </p>
      )}

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? tc('saving') : tc('save')}
      </Button>
    </div>
  )
}
