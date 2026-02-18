import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  Image,
  LayoutDashboard,
  Link2,
  Palette,
  Settings,
  UserCog,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type OrgRole = 'org_admin' | 'manager' | 'member'

export interface OrgSidebarItem {
  key: string
  labelKey: string
  href: string
  icon: LucideIcon
  minRole?: OrgRole
  children?: OrgSidebarItem[]
}

export interface OrgSidebarGroup {
  key: string
  labelKey: string
  items: OrgSidebarItem[]
}

const ROLE_HIERARCHY: Record<string, number> = {
  org_admin: 3,
  manager: 2,
  member: 1,
}

export function hasMinRole(userRole: string | null | undefined, minRole: OrgRole): boolean {
  if (!userRole) return false
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0)
}

export const orgSidebarConfig: OrgSidebarGroup[] = [
  {
    key: 'main',
    labelKey: '',
    items: [
      {
        key: 'dashboard',
        labelKey: 'org.sidebar.dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    key: 'analyses',
    labelKey: 'org.sidebar.groups.analyses',
    items: [
      {
        key: 'analyses',
        labelKey: 'org.sidebar.analyses',
        href: '/analyses',
        icon: BarChart3,
      },
      {
        key: 'employees',
        labelKey: 'org.sidebar.employees',
        href: '/employees',
        icon: UsersRound,
        minRole: 'manager',
      },
      {
        key: 'guides',
        labelKey: 'org.sidebar.guides',
        href: '/guides',
        icon: BookOpen,
      },
      {
        key: 'forms',
        labelKey: 'org.sidebar.forms',
        href: '/forms',
        icon: ClipboardList,
      },
    ],
  },
  {
    key: 'management',
    labelKey: 'org.sidebar.groups.management',
    items: [
      {
        key: 'users',
        labelKey: 'org.sidebar.users',
        href: '/users',
        icon: UserCog,
        minRole: 'org_admin',
      },
      {
        key: 'settings',
        labelKey: 'org.sidebar.settings',
        href: '/settings',
        icon: Settings,
        children: [
          {
            key: 'settings-general',
            labelKey: 'org.sidebar.settingsGeneral',
            href: '/settings',
            icon: Settings,
          },
          {
            key: 'settings-plan',
            labelKey: 'org.sidebar.settingsPlan',
            href: '/settings/plan',
            icon: CreditCard,
          },
          {
            key: 'settings-branding',
            labelKey: 'org.sidebar.settingsBranding',
            href: '/settings/branding',
            icon: Palette,
          },
          {
            key: 'settings-media',
            labelKey: 'org.sidebar.settingsMedia',
            href: '/settings/media',
            icon: Image,
          },
          {
            key: 'settings-notifications',
            labelKey: 'org.sidebar.settingsNotifications',
            href: '/settings/notifications',
            icon: Bell,
          },
          {
            key: 'settings-integrations',
            labelKey: 'org.sidebar.settingsIntegrations',
            href: '/settings/integrations',
            icon: Link2,
          },
        ],
      },
    ],
  },
]
