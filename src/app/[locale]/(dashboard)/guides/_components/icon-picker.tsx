'use client'

import {
  FileText,
  BookOpen,
  BookMarked,
  GraduationCap,
  Lightbulb,
  Shield,
  Scale,
  Heart,
  Users,
  Briefcase,
  Target,
  Compass,
  Award,
  Clock,
  TrendingUp,
  MessageSquare,
  Rocket,
  CircleDollarSign,
  Building2,
  Lock,
  Headphones,
  Megaphone,
  Leaf,
  Wrench,
  Map,
  Flame,
  Brain,
  Sparkles,
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
  { name: 'FileText', icon: FileText },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'BookMarked', icon: BookMarked },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Shield', icon: Shield },
  { name: 'Scale', icon: Scale },
  { name: 'Heart', icon: Heart },
  { name: 'Users', icon: Users },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Target', icon: Target },
  { name: 'Compass', icon: Compass },
  { name: 'Award', icon: Award },
  { name: 'Clock', icon: Clock },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'Rocket', icon: Rocket },
  { name: 'CircleDollarSign', icon: CircleDollarSign },
  { name: 'Building2', icon: Building2 },
  { name: 'Lock', icon: Lock },
  { name: 'Headphones', icon: Headphones },
  { name: 'Megaphone', icon: Megaphone },
  { name: 'Leaf', icon: Leaf },
  { name: 'Wrench', icon: Wrench },
  { name: 'Map', icon: Map },
  { name: 'Flame', icon: Flame },
  { name: 'Brain', icon: Brain },
  { name: 'Sparkles', icon: Sparkles },
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
      <div className="grid grid-cols-7 gap-1.5">
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
  const Icon = ICON_MAP[name] ?? FileText
  return <Icon className={className} />
}
