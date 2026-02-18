'use client'

import {
  Brain,
  Gauge,
  SquareActivity,
  Handshake,
  UserLock,
  MessagesSquare,
  Flag,
  MessageSquareText,
  MessageSquareWarning,
  Contact,
  MessageCircleMore,
  Heart,
  CircleGauge,
  Award,
  Calendar,
  Clock4,
  Hourglass,
  CalendarDays,
  Pencil,
  SquareMousePointer,
  BriefcaseBusiness,
  Bell,
  Mail,
  Building,
  Star,
  UserRoundCheck,
  UserRoundX,
  Users,
  ChartPie,
  ChartNoAxesColumn,
  ChartNoAxesCombined,
  Video,
  Send,
  File,
  Files,
  MailWarning,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const GUIDE_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Brain', icon: Brain },
  { name: 'Gauge', icon: Gauge },
  { name: 'SquareActivity', icon: SquareActivity },
  { name: 'Handshake', icon: Handshake },
  { name: 'UserLock', icon: UserLock },
  { name: 'MessagesSquare', icon: MessagesSquare },
  { name: 'Flag', icon: Flag },
  { name: 'MessageSquareText', icon: MessageSquareText },
  { name: 'MessageSquareWarning', icon: MessageSquareWarning },
  { name: 'Contact', icon: Contact },
  { name: 'MessageCircleMore', icon: MessageCircleMore },
  { name: 'Heart', icon: Heart },
  { name: 'CircleGauge', icon: CircleGauge },
  { name: 'Award', icon: Award },
  { name: 'Calendar', icon: Calendar },
  { name: 'Clock4', icon: Clock4 },
  { name: 'Hourglass', icon: Hourglass },
  { name: 'CalendarDays', icon: CalendarDays },
  { name: 'Pencil', icon: Pencil },
  { name: 'SquareMousePointer', icon: SquareMousePointer },
  { name: 'BriefcaseBusiness', icon: BriefcaseBusiness },
  { name: 'Bell', icon: Bell },
  { name: 'Mail', icon: Mail },
  { name: 'Building', icon: Building },
  { name: 'Star', icon: Star },
  { name: 'UserRoundCheck', icon: UserRoundCheck },
  { name: 'UserRoundX', icon: UserRoundX },
  { name: 'Users', icon: Users },
  { name: 'ChartPie', icon: ChartPie },
  { name: 'ChartNoAxesColumn', icon: ChartNoAxesColumn },
  { name: 'ChartNoAxesCombined', icon: ChartNoAxesCombined },
  { name: 'Video', icon: Video },
  { name: 'Send', icon: Send },
  { name: 'File', icon: File },
  { name: 'Files', icon: Files },
  { name: 'MailWarning', icon: MailWarning },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  GUIDE_ICON_OPTIONS.map((o) => [o.name, o.icon])
)

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-6 gap-1.5">
        {GUIDE_ICON_OPTIONS.map(({ name, icon: Icon }) => (
          <Tooltip key={name}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange(name)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-md border transition-colors',
                  value === name
                    ? 'ring-primary bg-primary/10 border-primary ring-2'
                    : 'border-border hover:bg-accent'
                )}
              >
                <Icon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

/** Render a guide icon by its stored name */
export function GuideIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICON_MAP[name] ?? File
  return <Icon className={className} />
}
