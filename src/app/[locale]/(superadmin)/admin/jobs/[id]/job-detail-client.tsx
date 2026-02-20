'use client'

import { useTranslations, useLocale } from 'next-intl'
import { format, formatDistanceToNow } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  Building2,
  User,
  FileText,
  AlertTriangle,
  RotateCcw,
  FlaskConical,
  Braces,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cancelAnalysisJob, retryAnalysisJob } from '../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface JobDetail {
  id: string
  organizationId: string
  subjectId: string
  requestedBy: string
  status: string
  errorMessage: string | null
  metadata: unknown
  isTest: boolean
  transcriptStoragePath: string
  n8nWebhookTriggeredAt: Date | null
  n8nCallbackReceivedAt: Date | null
  createdAt: Date
  updatedAt: Date
  orgName: string | null
  orgSlug: string | null
  subjectName: string | null
  subjectEmail: string | null
  requestedByEmail: string | null
  requestedByName: string | null
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; bgColor: string }
> = {
  pending: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  processing: { icon: Loader2, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  completed: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  failed: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  cancelled: { icon: Ban, color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-900/30' },
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function JobDetailClient({ job }: { job: JobDetail }) {
  const t = useTranslations('admin.jobs')
  const tDetail = useTranslations('admin.jobs.detail')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const router = useRouter()

  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
  const StatusIcon = config.icon

  async function handleCancel() {
    const result = await cancelAnalysisJob(job.id)
    if (result.success) {
      toast.success(t('jobCancelled'), { className: 'rounded-full', position: 'top-center' })
      router.refresh()
    } else {
      toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
    }
  }

  async function handleRetry() {
    const result = await retryAnalysisJob(job.id)
    if (result.success) {
      toast.success(t('jobRetried'), { className: 'rounded-full', position: 'top-center' })
      router.refresh()
    } else {
      toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
    }
  }

  function formatDate(date: Date | null) {
    if (!date) return null
    return format(new Date(date), 'PPpp', { locale: dateLocale })
  }

  function formatRelative(date: Date | null) {
    if (!date) return null
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: dateLocale })
  }

  // Build timeline steps
  const timelineSteps = [
    {
      label: tDetail('created'),
      date: job.createdAt,
      completed: true,
    },
    {
      label: tDetail('triggered'),
      date: job.n8nWebhookTriggeredAt,
      completed: !!job.n8nWebhookTriggeredAt,
    },
    {
      label: tDetail('callbackReceived'),
      date: job.n8nCallbackReceivedAt,
      completed: !!job.n8nCallbackReceivedAt,
    },
    {
      label: tDetail('statusChanged'),
      date: job.updatedAt,
      completed: job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/admin/jobs`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{tDetail('title')}</h1>
            {job.isTest && (
              <Badge variant="outline" className="gap-1 border-purple-300 bg-purple-100 dark:border-purple-700 dark:bg-purple-900/30">
                <FlaskConical className="size-3 text-purple-600" />
                <span className="text-purple-600">{tDetail('testMode')}</span>
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground font-mono text-sm">{job.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {(job.status === 'failed' || job.status === 'cancelled') && (
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RotateCcw className="mr-1.5 size-4" />
              {t('retry')}
            </Button>
          )}
          {(job.status === 'pending' || job.status === 'processing') && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Ban className="mr-1.5 size-4" />
                  {t('cancel')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('cancelConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('cancelConfirmDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancelNo')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('cancelYes')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Status + Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{tDetail('timeline')}</CardTitle>
            <Badge variant="outline" className={`gap-1 ${config.bgColor} border-0`}>
              <StatusIcon className={`size-3 ${config.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
              <span className={config.color}>{t(`status${capitalize(job.status)}`)}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex justify-between">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div
                    className={`flex size-8 items-center justify-center rounded-full border-2 ${
                      step.completed
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30 bg-background text-muted-foreground/50'
                    }`}
                  >
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className={`mt-2 text-xs font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      {formatRelative(step.date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {/* Connecting line */}
            <div className="absolute top-4 right-[calc(12.5%+16px)] left-[calc(12.5%+16px)] -translate-y-1/2">
              <div className="bg-muted-foreground/20 h-0.5 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Job Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              {tDetail('jobInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="ID" value={job.id} mono />
            <InfoRow
              label={t('columnStatus')}
              value={
                <Badge variant="outline" className={`gap-1 ${config.bgColor} border-0`}>
                  <StatusIcon className={`size-3 ${config.color} ${job.status === 'processing' ? 'animate-spin' : ''}`} />
                  <span className={config.color}>{t(`status${capitalize(job.status)}`)}</span>
                </Badge>
              }
            />
            <InfoRow
              label={t('columnCreated')}
              value={formatDate(job.createdAt) ?? '---'}
            />
            <InfoRow
              label={tDetail('transcript')}
              value={job.transcriptStoragePath}
              mono
            />
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              {tDetail('organization')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={tDetail('organization')}
              value={
                job.orgName ? (
                  <Link
                    href={`/${locale}/admin/organizations/${job.organizationId}`}
                    className="text-primary hover:underline"
                  >
                    {job.orgName}
                  </Link>
                ) : (
                  '---'
                )
              }
            />
            <InfoRow label="Slug" value={job.orgSlug ?? '---'} mono />
            <InfoRow label="ID" value={job.organizationId} mono />
          </CardContent>
        </Card>

        {/* Subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4" />
              {tDetail('subject')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={tDetail('subject')}
              value={job.subjectName ?? '---'}
            />
            <InfoRow
              label="E-Mail"
              value={job.subjectEmail ?? '---'}
            />
            <InfoRow label="ID" value={job.subjectId} mono />
          </CardContent>
        </Card>

        {/* Requested By */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4" />
              {tDetail('requestedBy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={tDetail('requestedBy')}
              value={job.requestedByName ?? job.requestedByEmail ?? '---'}
            />
            <InfoRow
              label="E-Mail"
              value={job.requestedByEmail ?? '---'}
            />
            <InfoRow label="ID" value={job.requestedBy} mono />
          </CardContent>
        </Card>

        {/* n8n Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Workflow className="size-4" />
              {tDetail('pipeline')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label={tDetail('triggered')}
              value={formatDate(job.n8nWebhookTriggeredAt) ?? '---'}
            />
            <InfoRow
              label={tDetail('callbackReceived')}
              value={formatDate(job.n8nCallbackReceivedAt) ?? '---'}
            />
          </CardContent>
        </Card>

        {/* Metadata / Payload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Braces className="size-4" />
              {tDetail('payload')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {job.metadata ? (
              <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
                {JSON.stringify(job.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">{tDetail('noMetadata')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      {job.errorMessage && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" />
              {tDetail('error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-destructive/5 max-h-64 overflow-auto rounded-md p-3 text-sm whitespace-pre-wrap">
              {job.errorMessage}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className={`text-right text-sm font-medium ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value}
      </span>
    </div>
  )
}
