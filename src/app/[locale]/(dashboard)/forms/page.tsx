import { getTranslations } from 'next-intl/server'
import { getAvailableForms } from './actions'
import { FormsListClient } from './forms-list-client'

export default async function FormsPage() {
  const t = await getTranslations('forms')
  const availableForms = await getAvailableForms()

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      <FormsListClient forms={availableForms} />
    </div>
  )
}
