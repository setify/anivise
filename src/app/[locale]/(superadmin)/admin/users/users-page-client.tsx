'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Search, Building2, Shield, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getAllPlatformUsers } from '../actions'

type PlatformUser = Awaited<ReturnType<typeof getAllPlatformUsers>>[number]

function getInitials(user: PlatformUser): string {
  if (user.displayName) return user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  if (user.fullName) return user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return user.email[0].toUpperCase()
}

function getUserDisplayName(user: PlatformUser): string {
  return user.displayName || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
}

const roleVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  superadmin: 'default',
  staff: 'secondary',
  org_admin: 'default',
  manager: 'secondary',
  member: 'outline',
}

export function UsersPageClient({
  initialUsers,
}: {
  initialUsers: PlatformUser[]
}) {
  const t = useTranslations('admin.users')
  const locale = useLocale()
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSearch(query: string) {
    setSearchQuery(query)
    startTransition(async () => {
      const results = await getAllPlatformUsers(query || undefined)
      setUsers(results)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('allUsers')}</CardTitle>
              <CardDescription>
                {t('totalUsers', { count: users.length })}
              </CardDescription>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {searchQuery ? t('noResults') : t('noUsers')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columnUser')}</TableHead>
                    <TableHead>{t('columnEmail')}</TableHead>
                    <TableHead>{t('columnPlatformRole')}</TableHead>
                    <TableHead>{t('columnOrganizations')}</TableHead>
                    <TableHead>{t('columnCreated')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={isPending ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            {user.avatarUrl && (
                              <AvatarImage
                                src={user.avatarUrl}
                                alt={getUserDisplayName(user)}
                              />
                            )}
                            <AvatarFallback className="text-xs">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {getUserDisplayName(user)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.platformRole ? (
                          <Badge variant={roleVariants[user.platformRole] || 'outline'}>
                            <Shield className="mr-1 size-3" />
                            {user.platformRole}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.organizations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.organizations.map((org) => (
                              <Link
                                key={org.orgId}
                                href={`/${locale}/admin/organizations/${org.orgId}`}
                              >
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer hover:bg-accent"
                                >
                                  <Building2 className="mr-1 size-3" />
                                  {org.orgName}
                                  <span className="text-muted-foreground ml-1">
                                    ({org.role})
                                  </span>
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t('noOrgs')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
