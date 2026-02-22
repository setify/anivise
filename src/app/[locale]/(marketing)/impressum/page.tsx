import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

export default function ImpressumPage() {
  const t = useTranslations('legal')

  return (
    <div className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Draft banner */}
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-800">
          <AlertTriangle className="size-5 shrink-0" />
          <span className="font-medium">{t('draftBanner')}</span>
        </div>

        <h1 className="mb-10 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t('impressum.title')}
        </h1>

        <div
          className="prose prose-gray max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: t.raw('impressum.content') }}
        />
      </div>
    </div>
  )
}
