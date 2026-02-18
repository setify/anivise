'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mic, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecordingRow } from '../actions'

interface RecordingsListProps {
  recordings: RecordingRow[]
}

const STATUS_COLORS: Record<string, string> = {
  recording: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  processing:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function RecordingsList({ recordings }: RecordingsListProps) {
  const t = useTranslations('analyses.detail.recording')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function formatDuration(seconds: number | null) {
    if (!seconds) return '--:--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="size-4" />
          {t('existingRecordings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recordings.map((rec) => (
          <div key={rec.id} className="rounded-md border">
            <div
              className="flex cursor-pointer items-center gap-3 p-3"
              onClick={() =>
                setExpandedId(expandedId === rec.id ? null : rec.id)
              }
            >
              <div className="text-muted-foreground shrink-0">
                {expandedId === rec.id ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatDate(rec.createdAt)}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${STATUS_COLORS[rec.status] ?? ''}`}
                  >
                    {t(`status.${rec.status}`)}
                  </Badge>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Clock className="size-3" />
                  {formatDuration(rec.durationSeconds)}
                  <span>·</span>
                  <span>{rec.recorderName}</span>
                  <span>·</span>
                  <span>{rec.language === 'de' ? 'Deutsch' : 'English'}</span>
                </div>
              </div>
            </div>

            {/* Expanded: show transcript */}
            {expandedId === rec.id && (
              <div className="border-t px-3 py-3">
                {rec.finalTranscript || rec.liveTranscript ? (
                  <div className="max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm">
                      {rec.finalTranscript ?? rec.liveTranscript}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    {t('noRecordings')}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
