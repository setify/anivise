import { Construction } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PagePlaceholderProps {
  message: string
  icon?: LucideIcon
}

export function PagePlaceholder({ message, icon: Icon = Construction }: PagePlaceholderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="text-muted-foreground mb-3 size-8" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}
