import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, FileText, Users, Clock } from 'lucide-react'

export default function DashboardPage() {
  const t = useTranslations('dashboard')

  const stats = [
    {
      title: t('stats.totalAnalyses'),
      value: '0',
      icon: BarChart3,
    },
    {
      title: t('stats.activeJobs'),
      value: '0',
      icon: Clock,
    },
    {
      title: t('stats.reports'),
      value: '0',
      icon: FileText,
    },
    {
      title: t('stats.teamMembers'),
      value: '0',
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('welcome')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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

      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('noActivity')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
