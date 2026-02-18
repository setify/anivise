'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { saveDesignSettings } from './actions'

interface Section {
  key: string
  title: string
  description: string
  content: string
  editable: boolean
}

export function DesignClient({ sections }: { sections: Section[] }) {
  const [isPending, startTransition] = useTransition()

  // Local editable state keyed by section.key
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(sections.map((s) => [s.key, s.content]))
  )

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('root', values[':root'] ?? '')
      fd.set('dark', values['.dark'] ?? '')
      const result = await saveDesignSettings(fd)
      if (result.success) {
        toast.success('Design gespeichert – Dev-Server neu starten um Änderungen zu sehen.')
      } else {
        toast.error(result.error ?? 'Fehler beim Speichern')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Design</h1>
          <p className="text-muted-foreground">
            CSS-Variablen des Anivise-Themes aus{' '}
            <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono">
              src/app/globals.css
            </code>
            . Änderungen werden direkt in die Datei geschrieben.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>

      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="font-mono text-base">{section.title}</CardTitle>
              <Badge variant={section.editable ? 'outline' : 'secondary'} className="text-xs">
                {section.editable ? 'editierbar' : 'read-only'}
              </Badge>
            </div>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {section.editable ? (
              <div className="relative">
                {/* Opening line (non-editable) */}
                <div className="bg-muted rounded-t-lg border-b border-border/50 px-4 py-2 font-mono text-xs text-foreground/60 select-none">
                  {section.key} {'{'}
                </div>
                <textarea
                  value={values[section.key]}
                  onChange={(e) => handleChange(section.key, e.target.value)}
                  spellCheck={false}
                  className="bg-muted/60 focus:bg-muted w-full resize-none rounded-none border-0 px-4 py-3 font-mono text-xs leading-relaxed text-foreground/90 outline-none focus:ring-0 focus-visible:ring-0"
                  style={{
                    minHeight: `${Math.max(10, (values[section.key] ?? '').split('\n').length + 2) * 1.6}rem`,
                    tabSize: 2,
                  }}
                  onKeyDown={(e) => {
                    // Tab → insert 2 spaces
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const el = e.currentTarget
                      const start = el.selectionStart
                      const end = el.selectionEnd
                      const newVal =
                        values[section.key].slice(0, start) + '  ' + values[section.key].slice(end)
                      handleChange(section.key, newVal)
                      // Restore cursor after state update
                      requestAnimationFrame(() => {
                        el.selectionStart = el.selectionEnd = start + 2
                      })
                    }
                  }}
                />
                {/* Closing brace */}
                <div className="bg-muted rounded-b-lg border-t border-border/50 px-4 py-2 font-mono text-xs text-foreground/60 select-none">
                  {'}'}
                </div>
              </div>
            ) : (
              <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs leading-relaxed">
                <code className="font-mono whitespace-pre text-foreground/90">
                  {section.key} {'{'}
                  {'\n'}
                  {section.content}
                  {'\n'}
                  {'}'}
                </code>
              </pre>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Speichern…' : 'Speichern'}
        </Button>
      </div>
    </div>
  )
}
