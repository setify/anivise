'use server'

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { revalidatePath } from 'next/cache'

const CSS_PATH = join(process.cwd(), 'src', 'app', 'globals.css')

/** Replace the inner content of a CSS block for a given selector. */
function replaceBlock(css: string, selector: string, newContent: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped}\\s*\\{)[^}]*(\\})`, 's')
  return css.replace(regex, `$1\n${newContent}\n$2`)
}

export async function saveDesignSettings(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePlatformRole('superadmin')

    const rootContent = formData.get('root') as string | null
    const darkContent = formData.get('dark') as string | null

    if (rootContent === null || darkContent === null) {
      return { success: false, error: 'Fehlende Inhalte' }
    }

    let css = readFileSync(CSS_PATH, 'utf-8')
    css = replaceBlock(css, ':root', rootContent)
    css = replaceBlock(css, '.dark', darkContent)
    writeFileSync(CSS_PATH, css, 'utf-8')

    revalidatePath('/admin/settings/design')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unbekannter Fehler' }
  }
}
