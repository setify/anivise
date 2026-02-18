import { readFileSync } from 'fs'
import { join } from 'path'
import { requirePlatformRole } from '@/lib/auth/require-platform-role'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Extract a CSS block by its selector (e.g. ":root", ".dark", "@theme inline")
function extractBlock(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 's')
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
  },
  {
    key: '.dark',
    title: 'Dark Mode – .dark',
    description: 'Überschreibungen für das dunkle Theme',
  },
  {
    key: '@theme inline',
    title: 'Theme Mapping – @theme inline',
    description: 'Tailwind v4 CSS-Variable-Mappings',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Design</h1>
        <p className="text-muted-foreground">
          Alle CSS-Variablen des Anivise-Themes aus{' '}
          <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono">src/app/globals.css</code>.
          Read-only – Änderungen direkt in der Datei vornehmen.
        </p>
      </div>

      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-mono">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs leading-relaxed">
              <code className="font-mono text-foreground/90 whitespace-pre">
                {section.key} {'{'}
                {'\n'}
                {section.content}
                {'\n'}
                {'}'}
              </code>
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
