import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  FlaskConical,
  Image,
  LayoutDashboard,
  Link2,
  Mail,
  Package,
  Paintbrush,
  Palette,
  Settings,
  Users,
  UserSearch,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface SidebarItem {
  key: string
  labelKey: string
  href: string
  icon: LucideIcon
  badge?: 'notifications'
  requiredRole?: 'superadmin'
  children?: SidebarItem[]
}

export interface SidebarGroup {
  key: string
  labelKey: string
  items: SidebarItem[]
}

export const adminSidebarConfig: SidebarGroup[] = [
  {
    key: 'main',
    labelKey: '',
    items: [
      {
        key: 'dashboard',
        labelKey: 'admin.sidebar.dashboard',
        href: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    key: 'content',
    labelKey: 'admin.sidebar.groups.content',
    items: [
      {
        key: 'analyses',
        labelKey: 'admin.sidebar.analyses',
        href: '/admin/jobs',
        icon: FlaskConical,
      },
      {
        key: 'forms',
        labelKey: 'admin.sidebar.forms',
        href: '/admin/forms',
        icon: ClipboardList,
      },
      {
        key: 'media',
        labelKey: 'admin.sidebar.media',
        href: '/admin/media',
        icon: Image,
      },
    ],
  },
  {
    key: 'customers',
    labelKey: 'admin.sidebar.groups.customers',
    items: [
      {
        key: 'organizations',
        labelKey: 'admin.sidebar.organizations',
        href: '/admin/organizations',
        icon: Building2,
      },
      {
        key: 'users',
        labelKey: 'admin.sidebar.users',
        href: '/admin/users',
        icon: UserSearch,
      },
      {
        key: 'plans',
        labelKey: 'admin.sidebar.plans',
        href: '/admin/plans',
        icon: Package,
      },
    ],
  },
  {
    key: 'platform',
    labelKey: 'admin.sidebar.groups.platform',
    items: [
      {
        key: 'team',
        labelKey: 'admin.sidebar.team',
        href: '/admin/team',
        icon: Users,
        requiredRole: 'superadmin',
      },
      {
        key: 'integrations',
        labelKey: 'admin.sidebar.integrations',
        href: '/admin/integrations',
        icon: Link2,
        requiredRole: 'superadmin',
      },
      {
        key: 'settings',
        labelKey: 'admin.sidebar.settings',
        href: '/admin/settings',
        icon: Settings,
        requiredRole: 'superadmin',
        children: [
          {
            key: 'settings-general',
            labelKey: 'admin.sidebar.settingsGeneral',
            href: '/admin/settings',
            icon: Settings,
          },
          {
            key: 'settings-email-layout',
            labelKey: 'admin.sidebar.settingsEmailLayout',
            href: '/admin/settings/email-layout',
            icon: Palette,
          },
          {
            key: 'settings-email-templates',
            labelKey: 'admin.sidebar.settingsEmailTemplates',
            href: '/admin/settings/emails',
            icon: Mail,
          },
          {
            key: 'settings-design',
            labelKey: 'admin.sidebar.settingsDesign',
            href: '/admin/settings/design',
            icon: Paintbrush,
          },
        ],
      },
    ],
  },
  {
    key: 'system',
    labelKey: 'admin.sidebar.groups.system',
    items: [
      {
        key: 'activity',
        labelKey: 'admin.sidebar.activity',
        href: '/admin/activity',
        icon: Activity,
      },
      {
        key: 'notifications',
        labelKey: 'admin.sidebar.notifications',
        href: '/admin/notifications',
        icon: Bell,
        badge: 'notifications',
      },
    ],
  },
]
