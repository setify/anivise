'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  generateDossier,
  getLatestDossierStatus,
  getAnalysisDossiers,
  retryDossier,
} from '../dossier-actions'
import type { DossierRow } from '../dossier-actions'

interface DossierSectionProps {
  analysisId: string
  initialDossiers: DossierRow[]
}

export function DossierSection({ analysisId, initialDossiers }: DossierSectionProps) {
  const t = useTranslations('analyses.detail.dossier')
  const tCommon = useTranslations('common')

  const [dossiers, setDossiers] = useState(initialDossiers)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [polling, setPolling] = useState(false)

  const latestDossier = dossiers[0] ?? null
  const isProcessing = latestDossier?.status === 'pending' || latestDossier?.status === 'processing'

  // Poll for status updates when processing
  const pollStatus = useCallback(async () => {
    const result = await getLatestDossierStatus(analysisId)
    if (!result) return

    if (result.status !== 'pending' && result.status !== 'processing') {
      // Done — reload full dossier data
      setPolling(false)
      const updated = await getAnalysisDossiers(analysisId)
      setDossiers(updated)

      if (result.status === 'completed') {
        toast.success(t('notificationCompleted'))
      } else if (result.status === 'failed') {
        toast.error(t('notificationFailed'))
      }
    }
  }, [analysisId, t])

  useEffect(() => {
    if (!isProcessing) return

    setPolling(true)
    const interval = setInterval(pollStatus, 5000)
    return () => clearInterval(interval)
  }, [isProcessing, pollStatus])

  async function handleGenerate() {
    setConfirmOpen(false)
    setGenerating(true)

    const result = await generateDossier(analysisId)

    if (result.success) {
      toast.success(t('notificationStarted'))
      // Reload dossiers
      const updated = await getAnalysisDossiers(analysisId)
      setDossiers(updated)
    } else if (result.error === 'already_in_progress') {
      toast.error(t('alreadyInProgress'))
    } else {
      toast.error(result.error ?? t('triggerError'))
    }

    setGenerating(false)
  }

  async function handleRetry() {
    if (!latestDossier) return
    setGenerating(true)

    const result = await retryDossier(latestDossier.id)

    if (result.success) {
      toast.success(t('notificationStarted'))
      const updated = await getAnalysisDossiers(analysisId)
      setDossiers(updated)
    } else {
      toast.error(result.error ?? t('triggerError'))
    }

    setGenerating(false)
  }

  function formatDuration(start: Date | null, end: Date | null) {
    if (!start || !end) return '—'
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const seconds = Math.round(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    return `${minutes}m ${remaining}s`
  }

  // No dossier yet
  if (!latestDossier) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            {t('noData')}
          </p>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {generating ? t('generating') : t('generate')}
          </Button>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            onConfirm={handleGenerate}
            t={t}
            tCommon={tCommon}
          />
        </CardContent>
      </Card>
    )
  }

  // Processing
  if (isProcessing) {
    return (
      <Card className={latestDossier.isTest ? 'border-dashed border-amber-400' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="size-4" />
              {t('title')}
            </CardTitle>
            {latestDossier.isTest && (
              <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
                {t('testBadge')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Loader2 className="text-primary size-5 animate-spin" />
            <div>
              <p className="text-sm font-medium">
                {latestDossier.status === 'pending'
                  ? t('statusPending')
                  : t('statusProcessing')}
              </p>
              <p className="text-muted-foreground text-xs">
                {t('description')}
              </p>
            </div>
          </div>
          {polling && (
            <p className="text-muted-foreground mt-3 text-xs">
              <RefreshCw className="mr-1 inline size-3 animate-spin" />
              Auto-refresh...
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Failed
  if (latestDossier.status === 'failed') {
    return (
      <Card className={latestDossier.isTest ? 'border-dashed border-amber-400' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="size-4" />
              {t('title')}
            </CardTitle>
            {latestDossier.isTest && (
              <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
                {t('testBadge')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {t('statusFailed')}
              </p>
              {latestDossier.errorMessage && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {t('errorMessage')}: {latestDossier.errorMessage}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-3.5" />
            )}
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Completed
  const resultData = latestDossier.resultData as {
    summary?: string
    confidence?: number
  } | null

  return (
    <Card className={latestDossier.isTest ? 'border-dashed border-amber-400' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4" />
            {t('title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {latestDossier.isTest && (
              <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
                {t('testBadge')}
              </Badge>
            )}
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="size-3" />
              {t('statusCompleted')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {resultData?.summary && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
              {t('summary')}
            </p>
            <p className="text-sm leading-relaxed">{resultData.summary}</p>
          </div>
        )}

        {/* Confidence */}
        {resultData?.confidence != null && (
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {t('confidence')}
            </p>
            <Badge variant="secondary">
              {Math.round(resultData.confidence * 100)}%
            </Badge>
          </div>
        )}

        {/* Metadata */}
        <div className="text-muted-foreground grid grid-cols-3 gap-3 border-t pt-3 text-xs">
          {latestDossier.modelUsed && (
            <div>
              <p className="font-medium">{t('model')}</p>
              <p className="truncate">{latestDossier.modelUsed}</p>
            </div>
          )}
          {latestDossier.tokenUsage && (
            <div>
              <p className="font-medium">{t('tokens')}</p>
              <p>
                {latestDossier.tokenUsage.prompt_tokens +
                  latestDossier.tokenUsage.completion_tokens}
              </p>
            </div>
          )}
          <div>
            <p className="font-medium">{t('duration')}</p>
            <p>{formatDuration(latestDossier.startedAt, latestDossier.completedAt)}</p>
          </div>
        </div>

        {/* Re-generate button */}
        <div className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 size-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-3.5" />
            )}
            {t('generate')}
          </Button>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleGenerate}
          t={t}
          tCommon={tCommon}
        />
      </CardContent>
    </Card>
  )
}

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  t,
  tCommon,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  t: ReturnType<typeof useTranslations>
  tCommon: ReturnType<typeof useTranslations>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('generateConfirm')}</DialogTitle>
          <DialogDescription>{t('generateDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={onConfirm}>
            <Sparkles className="mr-2 size-4" />
            {t('generate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
