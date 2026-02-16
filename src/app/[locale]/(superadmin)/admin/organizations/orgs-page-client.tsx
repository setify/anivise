'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  subscriptionTier: 'individual' | 'team' | 'enterprise'
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired'
  createdAt: Date
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  trial: 'outline',
  active: 'default',
  cancelled: 'destructive',
  expired: 'secondary',
}

export function OrganizationsPageClient({
  organizations,
  isSuperadmin,
}: {
  organizations: Organization[]
  isSuperadmin: boolean
}) {
  const t = useTranslations('admin.orgs')
  const locale = useLocale()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {isSuperadmin && (
          <Button asChild>
            <Link href={`/${locale}/admin/organizations/new`}>
              <Plus className="mr-2 size-4" />
              {t('createOrg')}
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noOrgs')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('slug')}</TableHead>
                  <TableHead>{t('tier')}</TableHead>
                  <TableHead>{t('tierStatus')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link
                        href={`/${locale}/admin/organizations/${org.id}`}
                        className="font-medium hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {org.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(
                          org.subscriptionTier === 'team'
                            ? 'teamTier'
                            : org.subscriptionTier
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[org.subscriptionStatus] || 'outline'}
                      >
                        {t(org.subscriptionStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
