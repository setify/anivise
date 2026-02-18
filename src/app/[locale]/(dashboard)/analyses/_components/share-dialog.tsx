'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import { shareAnalysis, unshareAnalysis } from '../actions'
import type { AnalysisShareRow, OrgManager } from '../actions'

interface ShareDialogProps {
  analysisId: string
  shares: AnalysisShareRow[]
  managers: OrgManager[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({
  analysisId,
  shares,
  managers,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const t = useTranslations('analyses.detail.share')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter out already-shared users from the selectable list
  const sharedUserIds = new Set(shares.map((s) => s.userId))
  const availableManagers = managers.filter(
    (m) => !sharedUserIds.has(m.userId) && !m.isCurrentUser
  )

  async function handleShare() {
    if (!selectedUserId) return
    setLoading(true)
    const result = await shareAnalysis(analysisId, selectedUserId)
    setLoading(false)

    if (result.success) {
      toast.success(t('success'))
      setSelectedUserId('')
    } else if (result.error === 'already_shared') {
      toast.error(t('alreadyShared'))
    } else {
      toast.error(t('error'))
    }
  }

  async function handleRemove(shareId: string) {
    const result = await unshareAnalysis(shareId)
    if (result.success) {
      toast.success(t('removeSuccess'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add share */}
          {availableManagers.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('selectUser')} />
                </SelectTrigger>
                <SelectContent>
                  {availableManagers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleShare}
                disabled={loading || !selectedUserId}
              >
                {t('add')}
              </Button>
            </div>
          )}

          {/* Current shares */}
          {shares.length === 0 ? (
            <p className="text-muted-foreground py-2 text-center text-sm">
              {t('empty')}
            </p>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-3 rounded-md border p-2"
                >
                  <AvatarDisplay
                    name={share.userName}
                    email={share.userEmail}
                    avatarUrl={share.userAvatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {share.userName}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {share.userEmail}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => handleRemove(share.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
