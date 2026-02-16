import { useTranslations } from 'next-intl'

export default function TeamPage() {
  const t = useTranslations('team')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
    </div>
  )
}
