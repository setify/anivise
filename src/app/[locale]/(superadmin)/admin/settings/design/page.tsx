import { readFileSync } from 'fs'
import { join } from 'path'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { DesignClient } from './design-client'

function extractBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's')
  const match = css.match(regex)
  if (!match) return ''
  return match[1]
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join('\n')
}

const SECTIONS = [
  {
    key: ':root',
    title: 'Light Mode – :root',
    description: 'Basis-Variablen: Farben, Radius, Fonts, Schatten',
    editable: true,
  },
  {
    key: '.dark',
    title: 'Dark Mode – .dark',
    description: 'Überschreibungen für das dunkle Theme',
    editable: true,
  },
  {
    key: '@theme inline',
    title: 'Theme Mapping – @theme inline',
    description: 'Tailwind v4 CSS-Variable-Mappings (nicht editierbar)',
    editable: false,
  },
]

export default async function DesignPage() {
  await requirePlatformRole('superadmin')

  const cssPath = join(process.cwd(), 'src', 'app', 'globals.css')
  const cssContent = readFileSync(cssPath, 'utf-8')

  const sections = SECTIONS.map((s) => ({
    ...s,
    content: extractBlock(cssContent, s.key),
  }))

  return <DesignClient sections={sections} />
}
