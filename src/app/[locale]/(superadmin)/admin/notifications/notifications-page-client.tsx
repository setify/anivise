'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatDistanceToNow, type Locale } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import {
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../actions'
import { toast } from 'sonner'

interface Notification {
  id: string
  recipientId: string
  type: string
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  metadata: unknown
  createdAt: Date
  readAt: Date | null
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  'org.created': Building2,
  'invitation.accepted': UserPlus,
  'invitation.expired': AlertTriangle,
  'team.member_joined': Users,
  'analysis.completed': CheckCircle2,
  'analysis.failed': AlertTriangle,
  'system.info': Info,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  'org.created': 'text-blue-500',
  'invitation.accepted': 'text-green-500',
  'invitation.expired': 'text-amber-500',
  'team.member_joined': 'text-indigo-500',
  'analysis.completed': 'text-green-500',
  'analysis.failed': 'text-red-500',
  'system.info': 'text-slate-500',
}

export function NotificationsPageClient({
  initialNotifications,
  initialTotal,
}: {
  initialNotifications: Notification[]
  initialTotal: number
}) {
  const t = useTranslations('admin.notifications')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const [isPending, startTransition] = useTransition()

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [total, setTotal] = useState(initialTotal)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const [offset, setOffset] = useState(0)
  const limit = 50

  function loadNotifications(newTab?: 'all' | 'unread', newOffset?: number) {
    const activeTab = newTab ?? tab
    const activeOffset = newOffset ?? 0

    startTransition(async () => {
      const result = await getAllNotifications({
        unreadOnly: activeTab === 'unread',
        offset: activeOffset,
        limit,
      })
      setNotifications(result.items as Notification[])
      setTotal(result.total)
      setOffset(activeOffset)
    })
  }

  function handleTabChange(value: string) {
    const newTab = value as 'all' | 'unread'
    setTab(newTab)
    loadNotifications(newTab, 0)
  }

  async function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      )
      toast.success(t('allMarkedRead'), {
        className: 'rounded-full',
        position: 'top-center',
      })
    })
  }

  async function handleMarkRead(notification: Notification) {
    if (notification.isRead) return
    await markNotificationRead(notification.id)
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, isRead: true, readAt: new Date() } : n
      )
    )
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">{t('tabAll')}</TabsTrigger>
            <TabsTrigger value="unread">
              {t('tabUnread')}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 px-1.5 py-0 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending || unreadCount === 0}
          >
            <CheckCheck className="mr-1.5 size-4" />
            {t('markAllRead')}
          </Button>
        </div>

        <TabsContent value="all" className="mt-4">
          <NotificationList
            notifications={notifications}
            onMarkRead={handleMarkRead}
            dateLocale={dateLocale}
            locale={locale}
            t={t}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          <NotificationList
            notifications={notifications}
            onMarkRead={handleMarkRead}
            dateLocale={dateLocale}
            locale={locale}
            t={t}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t('pageInfo', { from, to, total })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0 || isPending}
              onClick={() => loadNotifications(undefined, Math.max(0, offset - limit))}
            >
              <ChevronLeft className="mr-1 size-4" />
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + limit >= total || isPending}
              onClick={() => loadNotifications(undefined, offset + limit)}
            >
              {t('nextPage')}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationList({
  notifications,
  onMarkRead,
  dateLocale,
  locale,
  t,
}: {
  notifications: Notification[]
  onMarkRead: (n: Notification) => void
  dateLocale: Locale
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BellOff className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {notifications.map((notification) => {
          const Icon = NOTIFICATION_ICONS[notification.type] || Bell
          const iconColor = NOTIFICATION_COLORS[notification.type] || 'text-muted-foreground'

          const content = (
            <div
              className={`flex items-start gap-3 p-4 transition-colors ${
                !notification.isRead ? 'bg-accent/50' : ''
              } hover:bg-accent/30`}
            >
              <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
                {notification.body && (
                  <p className="text-muted-foreground mt-0.5 text-sm">{notification.body}</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </p>
              </div>
            </div>
          )

          if (notification.link) {
            return (
              <Link
                key={notification.id}
                href={notification.link}
                onClick={() => onMarkRead(notification)}
                className="block"
              >
                {content}
              </Link>
            )
          }

          return (
            <div
              key={notification.id}
              onClick={() => onMarkRead(notification)}
              className="cursor-pointer"
            >
              {content}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
