import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, Users, BarChart3 } from 'lucide-react'

export default function AdminPage() {
  const t = useTranslations('admin')

  const stats = [
    {
      title: t('stats.totalOrganizations'),
      value: '0',
      icon: Building2,
    },
    {
      title: t('stats.totalUsers'),
      value: '0',
      icon: Users,
    },
    {
      title: t('stats.totalAnalyses'),
      value: '0',
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <CardTitle>{t('organizations')}</CardTitle>
          <CardDescription>{t('organizationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('noOrganizations')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
