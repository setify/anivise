import {
  Activity,
  AudioWaveform,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  FolderOpen,
  Image,
  LayoutDashboard,
  Link2,
  Mail,
  MapPin,
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
        icon: AudioWaveform,
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
        children: [
          {
            key: 'guides-overview',
            labelKey: 'org.sidebar.guidesOverview',
            href: '/guides',
            icon: BookOpen,
          },
          {
            key: 'guides-categories',
            labelKey: 'org.sidebar.guidesCategories',
            href: '/guides/categories',
            icon: FolderOpen,
            minRole: 'org_admin',
          },
        ],
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
        children: [
          {
            key: 'users-list',
            labelKey: 'org.sidebar.usersList',
            href: '/users',
            icon: UserCog,
          },
          {
            key: 'users-departments',
            labelKey: 'org.sidebar.usersDepartments',
            href: '/users/departments',
            icon: Building2,
          },
          {
            key: 'users-locations',
            labelKey: 'org.sidebar.usersLocations',
            href: '/users/locations',
            icon: MapPin,
          },
        ],
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
            key: 'settings-emails',
            labelKey: 'org.sidebar.settingsEmails',
            href: '/settings/emails',
            icon: Mail,
            minRole: 'org_admin',
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
          {
            key: 'settings-activity-log',
            labelKey: 'org.sidebar.settingsActivityLog',
            href: '/settings/activity-log',
            icon: Activity,
            minRole: 'org_admin',
          },
        ],
      },
    ],
  },
]
