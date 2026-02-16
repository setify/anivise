export const APP_NAME = 'Anivise'

export const DEFAULT_LOCALE = 'de' as const

export const SUPPORTED_LOCALES = ['de', 'en'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]
