'use client'

import { useCallback, useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useTranslations } from 'next-intl'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paintbrush,
  Code,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  RemoveFormatting,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  className?: string
  placeholder?: string
}

const PRESET_COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#DC2626', '#EA580C', '#D97706', '#CA8A04',
  '#16A34A', '#059669', '#0D9488', '#0891B2',
  '#2563EB', '#4F46E5', '#7C3AED', '#9333EA',
  '#C026D3', '#DB2777', '#E11D48', '#FFFFFF',
]

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder,
}: RichTextEditorProps) {
  const t = useTranslations('ui.richTextEditor')
  const [isCodeView, setIsCodeView] = useState(false)
  const [codeValue, setCodeValue] = useState(value)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none px-3 py-2 min-h-[300px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
  })

  // Sync external value changes into editor
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  const toggleCodeView = useCallback(() => {
    if (isCodeView) {
      // Switching from code view to WYSIWYG
      editor?.commands.setContent(codeValue, { emitUpdate: false })
      onChange(codeValue)
    } else {
      // Switching from WYSIWYG to code view
      const html = editor?.getHTML() || ''
      setCodeValue(html)
    }
    setIsCodeView(!isCodeView)
  }, [isCodeView, codeValue, editor, onChange])

  const handleCodeChange = useCallback(
    (val: string) => {
      setCodeValue(val)
      onChange(val)
    },
    [onChange]
  )

  const setLink = useCallback(() => {
    if (!editor) return
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
    }
    setLinkUrl('')
    setLinkOpen(false)
  }, [editor, linkUrl])

  if (!editor) return null

  const activeHeadingLevel = [1, 2, 3, 4, 5, 6].find((level) =>
    editor.isActive('heading', { level })
  )

  const HeadingIcons: Record<number, typeof Heading1> = {
    1: Heading1,
    2: Heading2,
    3: Heading3,
    4: Heading4,
    5: Heading5,
    6: Heading6,
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'border-input focus-within:border-ring focus-within:ring-ring/50 rounded-md border bg-white shadow-xs focus-within:ring-[3px] dark:bg-input/30',
          className
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1.5">
          {/* Heading dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <Type className="size-3.5" />
                    {activeHeadingLevel ? `H${activeHeadingLevel}` : t('normal')}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('heading')}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setParagraph().run()
                }
              >
                {t('normal')}
              </DropdownMenuItem>
              {([1, 2, 3, 4, 5, 6] as const).map((level) => {
                const Icon = HeadingIcons[level]
                return (
                  <DropdownMenuItem
                    key={level}
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level }).run()
                    }
                  >
                    <Icon className="mr-2 size-4" />
                    {t('heading')} {level}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Bold */}
          <ToolbarButton
            icon={Bold}
            tooltip={t('bold')}
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          {/* Italic */}
          <ToolbarButton
            icon={Italic}
            tooltip={t('italic')}
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          {/* Underline */}
          <ToolbarButton
            icon={UnderlineIcon}
            tooltip={t('underline')}
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          {/* Strikethrough */}
          <ToolbarButton
            icon={Strikethrough}
            tooltip={t('strike')}
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Link */}
          <Popover open={linkOpen} onOpenChange={setLinkOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'size-7 p-0',
                      editor.isActive('link') && 'bg-accent'
                    )}
                    onClick={() => {
                      const existingHref = editor.getAttributes('link').href
                      setLinkUrl(existingHref || '')
                    }}
                  >
                    <LinkIcon className="size-3.5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('link')}</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-72 space-y-3 p-3" align="start">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('linkUrl')}</Label>
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setLink()
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={setLink}>
                  {t('link')}
                </Button>
                {editor.isActive('link') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run()
                      setLinkOpen(false)
                    }}
                  >
                    <RemoveFormatting className="mr-1 size-3" />
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Ordered list */}
          <ToolbarButton
            icon={ListOrdered}
            tooltip={t('orderedList')}
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          {/* Bullet list */}
          <ToolbarButton
            icon={List}
            tooltip={t('bulletList')}
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Alignment */}
          <ToolbarButton
            icon={AlignLeft}
            tooltip="Left"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          />
          <ToolbarButton
            icon={AlignCenter}
            tooltip="Center"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          />
          <ToolbarButton
            icon={AlignRight}
            tooltip="Right"
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          />

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          {/* Text color */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0"
                  >
                    <Palette className="size-3.5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('color')}</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-5 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="border-input size-6 rounded border shadow-xs transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      editor.chain().focus().setColor(color).run()
                    }
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1.5 h-6 w-full text-xs"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                {t('normal')}
              </Button>
            </PopoverContent>
          </Popover>

          {/* Highlight */}
          <ToolbarButton
            icon={Paintbrush}
            tooltip={t('highlight')}
            active={editor.isActive('highlight')}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          />

          <div className="flex-1" />

          {/* Code view toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={isCodeView ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={toggleCodeView}
              >
                <Code className="size-3.5" />
                {isCodeView ? t('richView') : t('codeView')}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isCodeView ? t('richView') : t('codeView')}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Editor content / Code view */}
        {isCodeView ? (
          <Textarea
            className="min-h-[300px] rounded-none rounded-b-md border-0 font-mono text-sm shadow-none focus-visible:ring-0"
            value={codeValue}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </TooltipProvider>
  )
}

function ToolbarButton({
  icon: Icon,
  tooltip,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('size-7 p-0', active && 'bg-accent')}
          onClick={onClick}
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
