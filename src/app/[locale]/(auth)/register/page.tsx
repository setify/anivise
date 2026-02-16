import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const t = useTranslations('auth.register')

  return (
    <div className="w-full max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
    </div>
  )
}
