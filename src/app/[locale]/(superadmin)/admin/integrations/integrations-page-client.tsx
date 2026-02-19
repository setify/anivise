'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Database,
  Mail,
  Mic,
  Workflow,
  Globe,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Download,
  Send,
  RotateCcw,
  Eye,
  EyeOff,
  Info,
  Copy,
  Play,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  saveIntegrationSecrets,
  getIntegrationSecretsForUI,
  testSupabaseConnection,
  testResendConnection,
  testN8nConnection,
  testN8nApiConnection,
  testDeepgramConnection,
  sendTestEmail,
  rotateN8nSecret,
  loadFromEnv,
  setWebhookEnvironment,
  dryRunWebhook,
  cleanupTestData,
} from './actions'
import { toast } from 'sonner'

interface VercelInfo {
  environment: string | null
  region: string | null
  gitBranch: string | null
  commitSha: string | null
  deploymentUrl: string | null
  isVercel: boolean
}

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error'

export function IntegrationsPageClient({ vercelInfo }: { vercelInfo: VercelInfo }) {
  const t = useTranslations('admin.integrations')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <SupabaseCard t={t} />
      <ResendCard t={t} />
      <N8nCard t={t} />
      <DeepgramCard t={t} />
      <VercelCard t={t} vercelInfo={vercelInfo} />
      <PaymentCard t={t} />
    </div>
  )
}

// ─── Supabase Card ───

function SupabaseCard({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [serviceRoleKey, setServiceRoleKey] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [latency, setLatency] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showAnon, setShowAnon] = useState(false)
  const [showService, setShowService] = useState(false)

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    const secrets = await getIntegrationSecretsForUI('supabase')
    for (const s of secrets) {
      if (s.key === 'url') setUrl(s.maskedValue || '')
      if (s.key === 'anon_key') setAnonKey(s.maskedValue || '')
      if (s.key === 'service_role_key') setServiceRoleKey(s.maskedValue || '')
    }
  }

  async function handleSave() {
    startTransition(async () => {
      const result = await saveIntegrationSecrets('supabase', [
        { key: 'url', value: url, isSensitive: false },
        { key: 'anon_key', value: anonKey, isSensitive: true },
        { key: 'service_role_key', value: serviceRoleKey, isSensitive: true },
      ])
      if (result.success) {
        toast.success(t('saved'), { className: 'rounded-full', position: 'top-center' })
        loadSaved()
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  async function handleTest() {
    setStatus('testing')
    setErrorMsg(null)
    const result = await testSupabaseConnection()
    setLatency(result.latency ?? null)
    if (result.success) {
      setStatus('connected')
    } else {
      setStatus('error')
      setErrorMsg(result.error ?? null)
    }
  }

  async function handleLoadEnv() {
    startTransition(async () => {
      const result = await loadFromEnv('supabase')
      if (result.success) {
        toast.success(t('envLoaded', { count: result.count ?? 0 }), { className: 'rounded-full', position: 'top-center' })
        loadSaved()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="size-6 text-green-600" />
            <div>
              <CardTitle className="text-base">Supabase</CardTitle>
              <CardDescription>{t('supabase.description')}</CardDescription>
            </div>
          </div>
          <StatusBadge status={status} latency={latency} t={t} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label>Project URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxx.supabase.co" />
          </div>
          <div>
            <Label>Anon Key</Label>
            <div className="flex gap-2">
              <Input
                type={showAnon ? 'text' : 'password'}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJ..."
              />
              <Button variant="ghost" size="icon" onClick={() => setShowAnon(!showAnon)}>
                {showAnon ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label>Service Role Key</Label>
            <div className="flex gap-2">
              <Input
                type={showService ? 'text' : 'password'}
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                placeholder="eyJ..."
              />
              <Button variant="ghost" size="icon" onClick={() => setShowService(!showService)}>
                {showService ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <p className="text-destructive text-sm">{errorMsg}</p>
        )}

        <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-xs">{t('supabase.hint')}</p>
        </div>

        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            {t('save')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleTest} disabled={status === 'testing'}>
            {status === 'testing' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <RefreshCw className="mr-1.5 size-4" />}
            {t('testConnection')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadEnv} disabled={isPending}>
            <Download className="mr-1.5 size-4" />
            {t('loadFromEnv')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Resend Card ───

function ResendCard({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [apiKey, setApiKey] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [latency, setLatency] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    const secrets = await getIntegrationSecretsForUI('resend')
    for (const s of secrets) {
      if (s.key === 'api_key') setApiKey(s.maskedValue || '')
      if (s.key === 'from_email') setFromEmail(s.maskedValue || '')
      if (s.key === 'from_name') setFromName(s.maskedValue || '')
    }
  }

  async function handleSave() {
    startTransition(async () => {
      const result = await saveIntegrationSecrets('resend', [
        { key: 'api_key', value: apiKey, isSensitive: true },
        { key: 'from_email', value: fromEmail, isSensitive: false },
        { key: 'from_name', value: fromName, isSensitive: false },
      ])
      if (result.success) {
        toast.success(t('saved'), { className: 'rounded-full', position: 'top-center' })
        loadSaved()
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  async function handleTest() {
    setStatus('testing')
    setErrorMsg(null)
    const result = await testResendConnection()
    setLatency(result.latency ?? null)
    if (result.success) {
      setStatus('connected')
    } else {
      setStatus('error')
      setErrorMsg(result.error ?? null)
    }
  }

  async function handleSendTest() {
    startTransition(async () => {
      const result = await sendTestEmail()
      if (result.success) {
        toast.success(t('resend.testSent'), { className: 'rounded-full', position: 'top-center' })
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  async function handleLoadEnv() {
    startTransition(async () => {
      const result = await loadFromEnv('resend')
      if (result.success) {
        toast.success(t('envLoaded', { count: result.count ?? 0 }), { className: 'rounded-full', position: 'top-center' })
        loadSaved()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="size-6 text-indigo-600" />
            <div>
              <CardTitle className="text-base">Resend (E-Mail)</CardTitle>
              <CardDescription>{t('resend.description')}</CardDescription>
            </div>
          </div>
          <StatusBadge status={status} latency={latency} t={t} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="re_..."
              />
              <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('resend.fromEmail')}</Label>
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="noreply@anivise.com" />
            </div>
            <div>
              <Label>{t('resend.fromName')}</Label>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Anivise" />
            </div>
          </div>
        </div>

        {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}

        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            {t('save')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleTest} disabled={status === 'testing'}>
            {status === 'testing' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <RefreshCw className="mr-1.5 size-4" />}
            {t('testConnection')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSendTest} disabled={isPending}>
            <Send className="mr-1.5 size-4" />
            {t('resend.sendTest')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadEnv} disabled={isPending}>
            <Download className="mr-1.5 size-4" />
            {t('loadFromEnv')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── n8n Card ───

function N8nCard({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [dossierWebhookUrl, setDossierWebhookUrl] = useState('')
  const [webhookUrlTest, setWebhookUrlTest] = useState('')
  const [dossierWebhookUrlTest, setDossierWebhookUrlTest] = useState('')
  const [healthUrl, setHealthUrl] = useState('')
  const [authHeaderName, setAuthHeaderName] = useState('X-Anivise-Secret')
  const [authHeaderValue, setAuthHeaderValue] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [apiStatus, setApiStatus] = useState<ConnectionStatus>('idle')
  const [latency, setLatency] = useState<number | null>(null)
  const [apiLatency, setApiLatency] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showSecret, setShowSecret] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null)

  // Environment toggle state
  const [analysisEnv, setAnalysisEnv] = useState<'production' | 'test'>('production')
  const [dossierEnv, setDossierEnv] = useState<'production' | 'test'>('production')
  const [dryRunLoading, setDryRunLoading] = useState<'analysis' | 'dossier' | null>(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    const secrets = await getIntegrationSecretsForUI('n8n')
    for (const s of secrets) {
      if (s.key === 'api_url') setApiUrl(s.maskedValue || '')
      if (s.key === 'api_key') setApiKey(s.maskedValue || '')
      if (s.key === 'webhook_url') setWebhookUrl(s.maskedValue || '')
      if (s.key === 'dossier_webhook_url') setDossierWebhookUrl(s.maskedValue || '')
      if (s.key === 'webhook_url_test') setWebhookUrlTest(s.maskedValue || '')
      if (s.key === 'dossier_webhook_url_test') setDossierWebhookUrlTest(s.maskedValue || '')
      if (s.key === 'health_url') setHealthUrl(s.maskedValue || '')
      if (s.key === 'auth_header_name') setAuthHeaderName(s.maskedValue || 'X-Anivise-Secret')
      if (s.key === 'auth_header_value') setAuthHeaderValue(s.maskedValue || '')
      if (s.key === 'webhook_env_analysis') setAnalysisEnv((s.maskedValue as 'test' | 'production') || 'production')
      if (s.key === 'webhook_env_dossier') setDossierEnv((s.maskedValue as 'test' | 'production') || 'production')
    }
  }

  async function handleSave() {
    startTransition(async () => {
      const result = await saveIntegrationSecrets('n8n', [
        { key: 'api_url', value: apiUrl, isSensitive: false },
        { key: 'api_key', value: apiKey, isSensitive: true },
        { key: 'webhook_url', value: webhookUrl, isSensitive: false },
        { key: 'dossier_webhook_url', value: dossierWebhookUrl, isSensitive: false },
        { key: 'webhook_url_test', value: webhookUrlTest, isSensitive: false },
        { key: 'dossier_webhook_url_test', value: dossierWebhookUrlTest, isSensitive: false },
        { key: 'health_url', value: healthUrl, isSensitive: false },
        { key: 'auth_header_name', value: authHeaderName, isSensitive: false },
        { key: 'auth_header_value', value: authHeaderValue, isSensitive: true },
      ])
      if (result.success) {
        toast.success(t('saved'), { className: 'rounded-full', position: 'top-center' })
        loadSaved()
        setRotatedSecret(null)
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  async function handleTest() {
    setStatus('testing')
    setErrorMsg(null)
    const result = await testN8nConnection()
    setLatency(result.latency ?? null)
    if (result.success) {
      setStatus('connected')
    } else {
      setStatus('error')
      setErrorMsg(result.error ?? null)
    }
  }

  async function handleTestApi() {
    setApiStatus('testing')
    const result = await testN8nApiConnection()
    setApiLatency(result.latency ?? null)
    if (result.success) {
      setApiStatus('connected')
    } else {
      setApiStatus('error')
      setErrorMsg(result.error ?? null)
    }
  }

  async function handleRotate() {
    startTransition(async () => {
      const result = await rotateN8nSecret()
      if (result.success && result.newSecret) {
        setRotatedSecret(result.newSecret)
        setAuthHeaderValue('••••••••••••' + result.newSecret.slice(-4))
        toast.success(t('n8n.secretRotated'), { className: 'rounded-full', position: 'top-center' })
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  async function handleLoadEnv() {
    startTransition(async () => {
      const result = await loadFromEnv('n8n')
      if (result.success) {
        toast.success(t('envLoaded', { count: result.count ?? 0 }), { className: 'rounded-full', position: 'top-center' })
        loadSaved()
      }
    })
  }

  async function handleEnvToggle(type: 'analysis' | 'dossier', env: 'production' | 'test') {
    startTransition(async () => {
      const result = await setWebhookEnvironment(type, env)
      if (result.success) {
        if (type === 'analysis') setAnalysisEnv(env)
        else setDossierEnv(env)
        toast.success(t('saved'), { className: 'rounded-full', position: 'top-center' })
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    })
  }

  async function handleDryRun(type: 'analysis' | 'dossier') {
    setDryRunLoading(type)
    try {
      const result = await dryRunWebhook(type)
      if (result.success) {
        toast.success(t('n8n.dryRunSuccess', { statusCode: result.statusCode ?? 0 }), {
          className: 'rounded-full',
          position: 'top-center',
          description: result.responseBody ? `${t('n8n.dryRunResponse')}: ${result.responseBody.slice(0, 200)}` : undefined,
        })
      } else {
        toast.error(
          result.statusCode
            ? t('n8n.dryRunFailed', { statusCode: result.statusCode })
            : result.error ?? 'Dry run failed',
          {
            className: 'rounded-full',
            position: 'top-center',
            description: result.responseBody ? result.responseBody.slice(0, 200) : undefined,
          }
        )
      }
    } finally {
      setDryRunLoading(null)
    }
  }

  async function handleCleanup() {
    setCleanupLoading(true)
    try {
      const result = await cleanupTestData()
      if (result.success) {
        toast.success(t('n8n.cleanupSuccess'), {
          className: 'rounded-full',
          position: 'top-center',
          description: t('n8n.cleanupDeleted', {
            dossiers: result.deletedDossiers ?? 0,
            jobs: result.deletedJobs ?? 0,
            reports: result.deletedReports ?? 0,
          }),
        })
      } else {
        toast.error(result.error, { className: 'rounded-full', position: 'top-center' })
      }
    } finally {
      setCleanupLoading(false)
    }
  }

  function EnvToggle({
    type,
    currentEnv,
  }: {
    type: 'analysis' | 'dossier'
    currentEnv: 'production' | 'test'
  }) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{t('n8n.webhookEnvironment')}:</span>
        <div className="inline-flex rounded-md border">
          <button
            type="button"
            onClick={() => handleEnvToggle(type, 'production')}
            disabled={isPending}
            className={`rounded-l-md px-3 py-1 text-xs font-medium transition-colors ${
              currentEnv === 'production'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {t('n8n.production')}
          </button>
          <button
            type="button"
            onClick={() => handleEnvToggle(type, 'test')}
            disabled={isPending}
            className={`rounded-r-md px-3 py-1 text-xs font-medium transition-colors ${
              currentEnv === 'test'
                ? 'bg-amber-500 text-white'
                : 'hover:bg-muted'
            }`}
          >
            {t('n8n.test')}
          </button>
        </div>
        {currentEnv === 'test' && (
          <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
            {t('n8n.test')}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Workflow className="size-6 text-orange-600" />
            <div>
              <CardTitle className="text-base">n8n ({t('n8n.subtitle')})</CardTitle>
              <CardDescription>{t('n8n.description')}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {apiStatus !== 'idle' && <StatusBadge status={apiStatus} latency={apiLatency} t={t} />}
            <StatusBadge status={status} latency={latency} t={t} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('n8n.apiSection')}</p>
          <div>
            <Label>{t('n8n.apiUrl')}</Label>
            <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://n8n.example.com" />
          </div>
          <div>
            <Label>{t('n8n.apiKey')}</Label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="n8n_api_..."
              />
              <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{t('n8n.apiKeyHint')}</p>
          </div>

          <Separator />
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('n8n.webhookSection')}</p>

          {/* Analysis Webhook */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Webhook URL (Analysis)</Label>
              <EnvToggle type="analysis" currentEnv={analysisEnv} />
            </div>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
            {analysisEnv === 'test' && (
              <div>
                <Label className="text-xs">{t('n8n.webhookUrlTest')}</Label>
                <Input
                  value={webhookUrlTest}
                  onChange={(e) => setWebhookUrlTest(e.target.value)}
                  placeholder="https://n8n.example.com/webhook-test/..."
                  className="border-amber-300 dark:border-amber-700"
                />
                <p className="text-muted-foreground mt-1 text-xs">{t('n8n.webhookUrlTestHint')}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDryRun('analysis')}
              disabled={dryRunLoading === 'analysis'}
            >
              {dryRunLoading === 'analysis' ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Play className="mr-1.5 size-3.5" />
              )}
              {t('n8n.dryRun')}
            </Button>
          </div>

          {/* Dossier Webhook */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t('n8n.dossierWebhookUrl')}</Label>
              <EnvToggle type="dossier" currentEnv={dossierEnv} />
            </div>
            <Input value={dossierWebhookUrl} onChange={(e) => setDossierWebhookUrl(e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
            <p className="text-muted-foreground text-xs">{t('n8n.dossierWebhookUrlHint')}</p>
            {dossierEnv === 'test' && (
              <div>
                <Label className="text-xs">{t('n8n.dossierWebhookUrlTest')}</Label>
                <Input
                  value={dossierWebhookUrlTest}
                  onChange={(e) => setDossierWebhookUrlTest(e.target.value)}
                  placeholder="https://n8n.example.com/webhook-test/..."
                  className="border-amber-300 dark:border-amber-700"
                />
                <p className="text-muted-foreground mt-1 text-xs">{t('n8n.webhookUrlTestHint')}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDryRun('dossier')}
              disabled={dryRunLoading === 'dossier'}
            >
              {dryRunLoading === 'dossier' ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Play className="mr-1.5 size-3.5" />
              )}
              {t('n8n.dryRun')}
            </Button>
          </div>

          <div>
            <Label>{t('n8n.healthUrl')}</Label>
            <Input value={healthUrl} onChange={(e) => setHealthUrl(e.target.value)} placeholder="https://n8n.example.com/healthz" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('n8n.authHeaderName')}</Label>
              <Input value={authHeaderName} onChange={(e) => setAuthHeaderName(e.target.value)} />
            </div>
            <div>
              <Label>{t('n8n.authHeaderValue')}</Label>
              <div className="flex gap-2">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={authHeaderValue}
                  onChange={(e) => setAuthHeaderValue(e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {rotatedSecret && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="mb-1 text-sm font-medium text-amber-800 dark:text-amber-200">{t('n8n.newSecretLabel')}</p>
            <div className="flex items-center gap-2">
              <code className="bg-background flex-1 truncate rounded px-2 py-1 font-mono text-xs">{rotatedSecret}</code>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => {
                  navigator.clipboard.writeText(rotatedSecret)
                  toast.success(t('copied'), { className: 'rounded-full', position: 'top-center' })
                }}
              >
                <Copy className="size-3" />
              </Button>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{t('n8n.newSecretHint')}</p>
          </div>
        )}

        {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}

        <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-xs">{t('n8n.webhookEnvironmentHint')}</p>
        </div>

        <div className="bg-muted/50 flex items-start gap-2 rounded-lg p-3">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-xs">{t('n8n.hint')}</p>
        </div>

        <Separator />

        {/* Cleanup test data section */}
        <div className="rounded-lg border border-dashed border-amber-300 p-3 dark:border-amber-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('n8n.cleanupTestData')}</p>
              <p className="text-muted-foreground text-xs">{t('n8n.cleanupTestDataDescription')}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30" disabled={cleanupLoading}>
                  {cleanupLoading ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 size-3.5" />
                  )}
                  {t('n8n.cleanupTestData')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('n8n.cleanupTestDataConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('n8n.cleanupTestDataDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    <Trash2 className="mr-1.5 size-4" />
                    {t('n8n.cleanupTestData')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            {t('save')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleTestApi} disabled={apiStatus === 'testing'}>
            {apiStatus === 'testing' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <RefreshCw className="mr-1.5 size-4" />}
            {t('n8n.testApi')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleTest} disabled={status === 'testing'}>
            {status === 'testing' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <RefreshCw className="mr-1.5 size-4" />}
            {t('n8n.testWebhook')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate} disabled={isPending}>
            <RotateCcw className="mr-1.5 size-4" />
            {t('n8n.rotateSecret')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadEnv} disabled={isPending}>
            <Download className="mr-1.5 size-4" />
            {t('loadFromEnv')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Deepgram Card ───

function DeepgramCard({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [apiKey, setApiKey] = useState('')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [latency, setLatency] = useState<number | null>(null)

  useEffect(() => {
    loadSaved()
  }, [])

  async function loadSaved() {
    const secrets = await getIntegrationSecretsForUI('deepgram')
    for (const s of secrets) {
      if (s.key === 'api_key') setApiKey(s.maskedValue || '')
    }
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveIntegrationSecrets('deepgram', [
        { key: 'api_key', value: apiKey, isSensitive: true },
      ])
      if (result.success) {
        toast.success(t('saved'))
        await loadSaved()
      } else {
        toast.error(result.error ?? 'Failed to save')
      }
    })
  }

  async function handleTest() {
    setStatus('testing')
    try {
      const result = await testDeepgramConnection()
      setLatency(result.latency ?? null)
      setStatus(result.success ? 'connected' : 'error')
      if (!result.success && result.error) {
        toast.error(result.error)
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="size-4" />
            Deepgram ({t('deepgram.subtitle')})
          </CardTitle>
          <CardDescription>{t('deepgram.description')}</CardDescription>
        </div>
        <StatusBadge status={status} latency={latency} t={t} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="dg_..."
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
            {t('save')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleTest} disabled={status === 'testing'}>
            {status === 'testing' ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <RefreshCw className="mr-2 size-3.5" />}
            {t('testConnection')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Vercel Card ───

function VercelCard({ t, vercelInfo }: { t: ReturnType<typeof useTranslations>; vercelInfo: VercelInfo }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="size-6" />
            <div>
              <CardTitle className="text-base">Vercel (Hosting)</CardTitle>
              <CardDescription>{t('vercel.description')}</CardDescription>
            </div>
          </div>
          <Badge variant={vercelInfo.isVercel ? 'default' : 'secondary'}>
            {vercelInfo.isVercel ? t('vercel.deployed') : t('vercel.local')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {vercelInfo.isVercel ? (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">{t('vercel.environment')}</p>
              <p className="font-medium">{vercelInfo.environment}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('vercel.region')}</p>
              <p className="font-medium">{vercelInfo.region || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('vercel.gitBranch')}</p>
              <p className="font-medium">{vercelInfo.gitBranch || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t('vercel.commitSha')}</p>
              <p className="font-mono font-medium">{vercelInfo.commitSha || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">{t('vercel.deploymentUrl')}</p>
              <p className="font-medium">{vercelInfo.deploymentUrl || '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t('vercel.notDeployed')}</p>
        )}
        <div className="bg-muted/50 mt-4 flex items-start gap-2 rounded-lg p-3">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-xs">{t('vercel.hint')}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Payment Card (Placeholder) ───

function PaymentCard({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="text-muted-foreground size-6" />
            <div>
              <CardTitle className="text-muted-foreground text-base">
                Payment ({t('payment.comingSoon')})
              </CardTitle>
              <CardDescription>{t('payment.description')}</CardDescription>
            </div>
          </div>
          <Badge variant="outline">{t('payment.planned')}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{t('payment.placeholder')}</p>
      </CardContent>
    </Card>
  )
}

// ─── Status Badge ───

function StatusBadge({
  status,
  latency,
  t,
}: {
  status: ConnectionStatus
  latency: number | null
  t: ReturnType<typeof useTranslations>
}) {
  if (status === 'testing') {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="size-3 animate-spin" />
        {t('status.testing')}
      </Badge>
    )
  }
  if (status === 'connected') {
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="size-3" />
        {t('status.connected')}
        {latency != null && <span className="ml-1 opacity-75">{latency}ms</span>}
      </Badge>
    )
  }
  if (status === 'error') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" />
        {t('status.error')}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">{t('status.idle')}</Badge>
  )
}
