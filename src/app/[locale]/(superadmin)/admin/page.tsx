import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'
import { getPlatformStats } from './actions'

export default async function AdminPage() {
  const stats = await getPlatformStats()

  return <AdminDashboard stats={stats} />
}

function AdminDashboard({
  stats,
}: {
  stats: { totalOrganizations: number; totalUsers: number }
}) {
  const t = useTranslations('admin')

  const statCards = [
    {
      title: t('stats.totalOrganizations'),
      value: stats.totalOrganizations.toString(),
      icon: Building2,
    },
    {
      title: t('stats.totalUsers'),
      value: stats.totalUsers.toString(),
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
