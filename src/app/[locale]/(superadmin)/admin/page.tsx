import { useTranslations } from 'next-intl'

export default function AdminPage() {
  const t = useTranslations('navigation')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('admin')}</h1>
    </div>
  )
}
