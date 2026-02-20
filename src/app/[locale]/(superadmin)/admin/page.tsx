import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Building2,
  Users,
  Activity,
  UserPlus,
  Mail,
  AlertTriangle,
  Plus,
  Eye,
  Settings,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react'
import { StatCard } from '@/components/admin/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPlatformStats, getRecentActivity, getSystemHealth } from './actions'

export default async function AdminPage() {
  const [stats, recentActivity, health] = await Promise.all([
    getPlatformStats(),
    getRecentActivity(),
    getSystemHealth(),
  ])

  return (
    <AdminDashboard
      stats={stats}
      recentActivity={recentActivity}
      health={health}
    />
  )
}

function AdminDashboard({
  stats,
  recentActivity,
  health,
}: {
  stats: Awaited<ReturnType<typeof getPlatformStats>>
  recentActivity: Awaited<ReturnType<typeof getRecentActivity>>
  health: Awaited<ReturnType<typeof getSystemHealth>>
}) {
  const t = useTranslations('admin')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t('stats.totalOrganizations')}
          value={stats.totalOrganizations}
          icon={Building2}
          description={stats.newOrgs7d > 0 ? t('stats.newThisWeek', { count: stats.newOrgs7d }) : undefined}
        />
        <StatCard
          title={t('stats.activeUsers')}
          value={stats.totalUsers}
          icon={Users}
          description={stats.newUsers7d > 0 ? t('stats.newThisWeek', { count: stats.newUsers7d }) : undefined}
        />
        <StatCard
          title={t('stats.runningAnalyses')}
          value={stats.runningAnalyses}
          icon={Activity}
        />
        <StatCard
          title={t('stats.newSignups')}
          value={stats.newSignups}
          icon={UserPlus}
          trend={stats.signupTrend !== 0 ? { value: stats.signupTrend, label: t('stats.vsLastWeek') } : undefined}
        />
        <StatCard
          title={t('stats.openInvitations')}
          value={stats.openInvitations}
          icon={Mail}
        />
        <StatCard
          title={t('stats.failedJobs')}
          value={stats.failedJobs}
          icon={AlertTriangle}
        />
      </div>

      {/* System Health */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('dashboard.systemHealth')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/integrations">
                <Settings className="mr-1.5 size-3.5" />
                {t('dashboard.manageIntegrations')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {health.map((h) => (
              <HealthItem
                key={h.service}
                service={h.service}
                status={h.status}
                latency={h.latency}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions + Recent Activity */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start h-auto py-2.5" asChild>
              <Link href="/admin/organizations/new">
                <Plus className="mr-2 size-4" />
                {t('dashboard.createOrganization')}
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-2.5" asChild>
              <Link href="/admin/jobs?status=failed">
                <AlertTriangle className="mr-2 size-4" />
                {t('dashboard.viewFailedJobs')}
                {stats.failedJobs > 0 && (
                  <Badge variant="destructive" className="ml-auto">{stats.failedJobs}</Badge>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-2.5" asChild>
              <Link href="/admin/integrations">
                <Settings className="mr-2 size-4" />
                {t('dashboard.manageIntegrations')}
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-2.5" asChild>
              <Link href="/admin/activity">
                <Eye className="mr-2 size-4" />
                {t('dashboard.viewActivity')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.recentActivity')}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/activity">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('dashboard.noActivity')}</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((entry) => (
                  <ActivityEntry key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const serviceLabels: Record<string, string> = {
  supabase: 'Supabase',
  resend: 'Resend',
  n8n: 'n8n',
  deepgram: 'Deepgram',
}

function HealthItem({
  service,
  status,
  latency,
}: {
  service: string
  status: 'connected' | 'error' | 'not_configured'
  latency?: number
}) {
  const t = useTranslations('admin.dashboard')

  const icon =
    status === 'connected' ? (
      <CheckCircle2 className="size-4 text-green-500" />
    ) : status === 'error' ? (
      <XCircle className="size-4 text-red-500" />
    ) : (
      <MinusCircle className="text-muted-foreground size-4" />
    )

  const statusText =
    status === 'connected'
      ? t('healthConnected')
      : status === 'error'
        ? t('healthError')
        : t('healthNotConfigured')

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {serviceLabels[service] || service}
        </p>
        <p className="text-muted-foreground text-xs">
          {statusText}
          {latency != null && status === 'connected' && ` · ${latency}ms`}
        </p>
      </div>
    </div>
  )
}

function ActivityEntry({
  entry,
}: {
  entry: Awaited<ReturnType<typeof getRecentActivity>>[number]
}) {
  const actionParts = entry.action.split('.')
  const category = actionParts[0]
  const action = actionParts.slice(1).join('.')

  const timeAgo = getTimeAgo(entry.createdAt)

  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
        <ActionIcon category={category} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate">
          <span className="font-medium">{entry.actorEmail.split('@')[0]}</span>
          <span className="text-muted-foreground"> · {action}</span>
        </p>
        <p className="text-muted-foreground text-xs">
          {entry.entityType} · {timeAgo}
        </p>
      </div>
    </div>
  )
}

function ActionIcon({ category }: { category: string }) {
  switch (category) {
    case 'org':
      return <Building2 className="text-muted-foreground size-3.5" />
    case 'user':
      return <Users className="text-muted-foreground size-3.5" />
    case 'settings':
      return <Settings className="text-muted-foreground size-3.5" />
    default:
      return <Activity className="text-muted-foreground size-3.5" />
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}
