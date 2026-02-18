'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Mic,
  Clock,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Square,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRecordingAudioUrl } from '../actions'
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
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  function formatDuration(seconds: number | null) {
    if (!seconds) return '--:--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0)
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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

  async function handlePlay(recordingId: string) {
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (playingId === recordingId) {
      setPlayingId(null)
      return
    }

    setLoadingAudio(recordingId)
    const url = await getRecordingAudioUrl(recordingId)
    setLoadingAudio(null)

    if (!url) return

    const audio = new Audio(url)
    audioRef.current = audio
    setPlayingId(recordingId)

    audio.play()
    audio.onended = () => {
      setPlayingId(null)
      audioRef.current = null
    }
    audio.onerror = () => {
      setPlayingId(null)
      audioRef.current = null
    }
  }

  function handleStopPlayback() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingId(null)
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
            <div className="flex items-center gap-3 p-3">
              {/* Play button */}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={rec.status !== 'completed' || loadingAudio === rec.id}
                onClick={(e) => {
                  e.stopPropagation()
                  if (playingId === rec.id) handleStopPlayback()
                  else handlePlay(rec.id)
                }}
              >
                {loadingAudio === rec.id ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : playingId === rec.id ? (
                  <Square className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
              </Button>

              {/* Info */}
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === rec.id ? null : rec.id)
                }
              >
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

              {/* Expand toggle */}
              <button
                className="text-muted-foreground shrink-0 p-1"
                onClick={() =>
                  setExpandedId(expandedId === rec.id ? null : rec.id)
                }
              >
                {expandedId === rec.id ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            </div>

            {/* Transcript */}
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
                    {t('noTranscript')}
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
