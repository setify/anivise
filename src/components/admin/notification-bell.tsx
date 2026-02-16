'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Bell } from 'lucide-react'
import { formatDistanceToNow, type Locale } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  getRecentNotifications,
  getUnreadCount,
  markNotificationRead,
} from '@/app/[locale]/(superadmin)/admin/actions'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: Date
}

export function NotificationBell() {
  const t = useTranslations('admin.notifications')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS

  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadUnreadCount()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadUnreadCount() {
    const count = await getUnreadCount()
    setUnreadCount(count)
  }

  async function loadNotifications() {
    const result = await getRecentNotifications()
    setNotifications(result as Notification[])
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open) {
      loadNotifications()
    }
  }

  async function handleClick(notification: Notification) {
    if (!notification.isRead) {
      await markNotificationRead(notification.id)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      )
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b p-3">
          <h4 className="text-sm font-semibold">{t('title')}</h4>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-sm">
              {t('empty')}
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-b p-3 last:border-0 ${
                  !notification.isRead ? 'bg-accent/50' : ''
                }`}
              >
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => {
                      handleClick(notification)
                      setIsOpen(false)
                    }}
                    className="block"
                  >
                    <NotificationItem
                      notification={notification}
                      dateLocale={dateLocale}
                    />
                  </Link>
                ) : (
                  <div
                    onClick={() => handleClick(notification)}
                    className="cursor-pointer"
                  >
                    <NotificationItem
                      notification={notification}
                      dateLocale={dateLocale}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            asChild
            onClick={() => setIsOpen(false)}
          >
            <Link href={`/${locale}/admin/notifications`}>
              {t('viewAll')}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  dateLocale,
}: {
  notification: Notification
  dateLocale: Locale
}) {
  return (
    <div className="flex gap-2">
      {!notification.isRead && (
        <div className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
      )}
      <div className={`flex-1 ${notification.isRead ? 'ml-4' : ''}`}>
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.body && (
          <p className="text-muted-foreground text-xs">{notification.body}</p>
        )}
        <p className="text-muted-foreground mt-1 text-[11px]">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: dateLocale,
          })}
        </p>
      </div>
    </div>
  )
}
