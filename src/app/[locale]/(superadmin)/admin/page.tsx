import { useTranslations } from 'next-intl'
import {
  Building2,
  Users,
  Activity,
  UserPlus,
  Mail,
  AlertTriangle,
} from 'lucide-react'
import { StatCard } from '@/components/admin/stat-card'

export default function AdminPage() {
  return <AdminDashboard />
}

function AdminDashboard() {
  const t = useTranslations('admin')

  const statCards = [
    {
      title: t('stats.totalOrganizations'),
      value: '—',
      icon: Building2,
      description: t('stats.placeholder'),
    },
    {
      title: t('stats.activeUsers'),
      value: '—',
      icon: Users,
      description: t('stats.placeholder'),
    },
    {
      title: t('stats.runningAnalyses'),
      value: '—',
      icon: Activity,
      description: t('stats.placeholder'),
    },
    {
      title: t('stats.newSignups'),
      value: '—',
      icon: UserPlus,
      description: t('stats.placeholder'),
    },
    {
      title: t('stats.openInvitations'),
      value: '—',
      icon: Mail,
      description: t('stats.placeholder'),
    },
    {
      title: t('stats.failedJobs'),
      value: '—',
      icon: AlertTriangle,
      description: t('stats.placeholder'),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  )
}
