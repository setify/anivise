'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Save, MoreHorizontal, Globe, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface BuilderToolbarProps {
  formId: string
  title: string
  onTitleChange: (title: string) => void
  onSave: () => Promise<void>
  onPublish: () => Promise<void>
  onPreview: () => void
  onSettings: () => void
  saveStatus: 'saved' | 'saving' | 'unsaved'
  locale: string
}

export function BuilderToolbar({
  formId,
  title,
  onTitleChange,
  onSave,
  onPublish,
  onPreview,
  onSettings,
  saveStatus,
  locale,
}: BuilderToolbarProps) {
  const t = useTranslations('admin.forms.builder')
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-background flex items-center gap-3 border-b px-4 py-2">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => router.push(`/${locale}/admin/forms`)}
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </Button>

      <div className="mx-2 h-5 w-px bg-border" />

      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="h-8 max-w-xs border-none bg-transparent text-sm font-semibold shadow-none focus-visible:ring-1"
      />

      <span
        className={cn(
          'text-xs transition-colors',
          saveStatus === 'saved' && 'text-muted-foreground',
          saveStatus === 'saving' && 'text-yellow-600',
          saveStatus === 'unsaved' && 'text-orange-500'
        )}
      >
        {t(`saveStatus.${saveStatus}`)}
      </span>

      <div className="flex-1" />

      <Button variant="outline" size="sm" className="gap-1.5" onClick={onPreview}>
        <Eye className="size-3.5" />
        {t('preview')}
      </Button>

      <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
        <Save className="size-3.5" />
        {t('save')}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPublish}>
            <Globe className="mr-2 size-4" />
            {t('publish')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSettings}>
            <Settings2 className="mr-2 size-4" />
            {t('settings')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
