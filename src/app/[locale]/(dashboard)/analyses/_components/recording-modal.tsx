'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Mic, Square, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  startRecording,
  finishRecording,
  checkDeepgramAvailable,
  getDeepgramKey,
  uploadRecordingChunk,
} from '../actions'

// ─── Constants ──────────────────────────────────────────────────────

const CHUNK_INTERVAL_MS = 60_000
const WAVEFORM_BARS = 48
const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen'

// ─── Types ──────────────────────────────────────────────────────────

interface RecordingModalProps {
  analysisId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordingComplete: () => void
}

type RecordingState = 'idle' | 'recording' | 'stopping'

// ─── Component ──────────────────────────────────────────────────────

export function RecordingModal({
  analysisId,
  open,
  onOpenChange,
  onRecordingComplete,
}: RecordingModalProps) {
  const t = useTranslations('analyses.detail.recording')
  const tCommon = useTranslations('common')

  const [state, setState] = useState<RecordingState>('idle')
  const [language, setLanguage] = useState('de')
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState<string[]>([])
  const [waveformData, setWaveformData] = useState<number[]>(
    new Array(WAVEFORM_BARS).fill(0)
  )
  const [confirmStop, setConfirmStop] = useState(false)
  const [deepgramAvailable, setDeepgramAvailable] = useState<boolean | null>(
    null
  )

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deepgramWsRef = useRef<WebSocket | null>(null)
  const dgRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIdRef = useRef<string | null>(null)
  const storagePathRef = useRef<string | null>(null)
  const chunkIndexRef = useRef(0)
  const chunksRef = useRef<Blob[]>([])
  const allChunksRef = useRef<Blob[]>([])
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)

  // ─── Deepgram check ───────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    checkDeepgramAvailable()
      .then((ok) => setDeepgramAvailable(ok))
      .catch(() => setDeepgramAvailable(false))
  }, [open])

  // ─── beforeunload ─────────────────────────────────────────────────

  useEffect(() => {
    if (state !== 'recording') return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state])

  // ─── Cleanup ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => stopEverything()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Auto-scroll transcript ───────────────────────────────────────

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop =
        transcriptScrollRef.current.scrollHeight
    }
  }, [transcript])

  // ─── Helpers ──────────────────────────────────────────────────────

  function stopEverything() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (dgRecorderRef.current?.state !== 'inactive') {
      try { dgRecorderRef.current?.stop() } catch {}
    }
    dgRecorderRef.current = null
    if (deepgramWsRef.current) {
      deepgramWsRef.current.close()
      deepgramWsRef.current = null
    }
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current?.stop() } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0)
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // ─── Start recording ─────────────────────────────────────────────

  async function handleStart() {
    // Step 1: Get microphone access
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
    } catch (err) {
      toast.error(t('errorMicrophone'))
      return
    }

    try {
      streamRef.current = stream

      const result = await startRecording(analysisId, language)
      if (!result.success || !result.recordingId) {
        toast.error(`${t('errorStart')}: ${result.error ?? 'unknown'}`)
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      recordingIdRef.current = result.recordingId
      storagePathRef.current = result.storagePath ?? null

      // Audio analyser for waveform
      const audioCtx = new AudioContext()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser

      // MediaRecorder — try WebM/Opus, fallback to default
      let mimeType = 'audio/webm;codecs=opus'
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '' // let browser choose
        }
      }

      const recorderOpts: MediaRecorderOptions = { audioBitsPerSecond: 64000 }
      if (mimeType) recorderOpts.mimeType = mimeType

      const recorder = new MediaRecorder(stream, recorderOpts)
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      allChunksRef.current = []
      chunkIndexRef.current = 0

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
          allChunksRef.current.push(e.data)
        }
      }
      recorder.start(1000)

      // Deepgram live transcription
      connectDeepgram(stream, language)

      // Timer
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      // Chunk upload timer
      chunkTimerRef.current = setInterval(() => uploadChunk(), CHUNK_INTERVAL_MS)

      // Waveform
      drawWaveform()

      setState('recording')
    } catch (err) {
      // Microphone was granted but something else failed — clean up
      stream.getTracks().forEach((t) => t.stop())
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Recording] Start failed:', err)
      toast.error(`${t('errorStart')}: ${msg}`)
    }
  }

  // ─── Deepgram WebSocket ───────────────────────────────────────────

  async function connectDeepgram(stream: MediaStream, lang: string) {
    try {
      const key = await getDeepgramKey()
      if (!key) return

      // Don't specify encoding — let Deepgram auto-detect from the WebM container
      const params = new URLSearchParams({
        model: 'nova-3',
        language: lang,
        smart_format: 'true',
        punctuate: 'true',
        interim_results: 'false',
        endpointing: '500',
      })

      const ws = new WebSocket(`${DEEPGRAM_WS_URL}?${params}`, ['token', key])
      deepgramWsRef.current = ws

      ws.onopen = () => {
        // Separate MediaRecorder to stream audio to Deepgram
        const dgRec = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 64000,
        })
        dgRecorderRef.current = dgRec

        dgRec.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data)
          }
        }
        dgRec.start(250)
      }

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          const alt = data.channel?.alternatives?.[0]
          if (alt?.transcript) {
            const text = alt.transcript.trim()
            if (text) {
              setTranscript((prev) => [...prev, text])
            }
          }
        } catch {}
      }

      ws.onerror = () => {}
      ws.onclose = () => {
        if (dgRecorderRef.current?.state !== 'inactive') {
          try { dgRecorderRef.current?.stop() } catch {}
        }
      }
    } catch {}
  }

  // ─── Waveform ─────────────────────────────────────────────────────

  function drawWaveform() {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    setWaveformData(
      Array.from(dataArray)
        .slice(0, WAVEFORM_BARS)
        .map((v) => v / 255)
    )
    animFrameRef.current = requestAnimationFrame(drawWaveform)
  }

  // ─── Chunk upload (via server action) ──────────────────────────────

  async function blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  async function uploadChunk() {
    if (chunksRef.current.length === 0 || !recordingIdRef.current) return

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    chunksRef.current = []
    const idx = chunkIndexRef.current
    chunkIndexRef.current++

    try {
      const base64 = await blobToBase64(blob)
      await uploadRecordingChunk(recordingIdRef.current, String(idx), base64)
    } catch {}
  }

  async function uploadFinalFile() {
    if (allChunksRef.current.length === 0 || !recordingIdRef.current) return

    const blob = new Blob(allChunksRef.current, { type: 'audio/webm' })

    try {
      const base64 = await blobToBase64(blob)
      await uploadRecordingChunk(recordingIdRef.current, 'final', base64)
    } catch {}
  }

  // ─── Stop recording ───────────────────────────────────────────────

  async function handleStop() {
    setState('stopping')

    // Upload remaining safety chunks
    await uploadChunk()

    // Close Deepgram
    if (dgRecorderRef.current?.state !== 'inactive') {
      try { dgRecorderRef.current?.stop() } catch {}
    }
    if (deepgramWsRef.current) {
      deepgramWsRef.current.close()
      deepgramWsRef.current = null
    }

    // Stop timers + animation
    if (timerRef.current) clearInterval(timerRef.current)
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    // Stop recorder
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }

    // Upload the complete recording as one file
    await uploadFinalFile()

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Save + set status to completed
    if (recordingIdRef.current) {
      const fullTranscript = transcript.join(' ')
      await finishRecording(recordingIdRef.current, elapsed, fullTranscript)
    }

    toast.success(t('saved'))
    setState('idle')
    setElapsed(0)
    setTranscript([])
    setWaveformData(new Array(WAVEFORM_BARS).fill(0))
    recordingIdRef.current = null
    storagePathRef.current = null
    onRecordingComplete()
    onOpenChange(false)
  }

  // ─── Close protection ─────────────────────────────────────────────

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && state === 'recording') {
      setConfirmStop(true)
      return
    }
    if (state === 'idle') {
      onOpenChange(newOpen)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-lg overflow-hidden"
          onPointerDownOutside={(e) => {
            if (state === 'recording') e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (state === 'recording') e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="size-5" />
              {t('modalTitle')}
            </DialogTitle>
            {state === 'idle' && (
              <DialogDescription>{t('modalDescription')}</DialogDescription>
            )}
          </DialogHeader>

          {state === 'idle' ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('language')}</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deepgramAvailable === false && (
                <div className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 flex items-start gap-2 rounded-md p-3 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{t('noTranscription')}</span>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleStart} className="gap-2">
                  <Mic className="size-4" />
                  {t('startButton')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Status + timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-red-500" />
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {t('recordingLabel')}
                  </Badge>
                </div>
                <span className="font-mono text-2xl font-bold tabular-nums tracking-wider">
                  {formatTime(elapsed)}
                </span>
              </div>

              {/* Waveform */}
              <div className="bg-muted/50 flex h-16 items-end justify-center gap-px overflow-hidden rounded-lg px-1">
                {waveformData.map((val, i) => (
                  <div
                    key={i}
                    className="bg-primary/80 min-w-[3px] flex-1 rounded-t-sm transition-all duration-75"
                    style={{ height: `${Math.max(4, val * 100)}%` }}
                  />
                ))}
              </div>

              {/* Live transcript */}
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {t('liveTranscript')}
                </p>
                <div
                  ref={transcriptScrollRef}
                  className="bg-muted/30 h-36 overflow-y-auto rounded-lg border p-3"
                >
                  {transcript.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">
                      {deepgramAvailable
                        ? t('waitingForSpeech')
                        : t('transcriptionUnavailable')}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {transcript.map((line, i) => (
                        <p
                          key={i}
                          className={`text-sm ${
                            i === transcript.length - 1
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stop */}
              <div className="flex justify-center pt-2">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setConfirmStop(true)}
                  disabled={state === 'stopping'}
                  className="gap-2 px-8"
                >
                  <Square className="size-4" />
                  {state === 'stopping' ? t('stopping') : t('stopButton')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm stop */}
      <Dialog open={confirmStop} onOpenChange={setConfirmStop}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('confirmStopTitle')}</DialogTitle>
            <DialogDescription>{t('confirmStopDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStop(false)}>
              {t('continueRecording')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmStop(false)
                handleStop()
              }}
            >
              <Square className="mr-2 size-3.5" />
              {t('stopAndSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
