'use client'

import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
  Link2,
  Unlink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { htmlToMarkdown, markdownToHtml } from '@/lib/html-markdown'

interface RichTextEditorProps {
  content: string
  onChange: (markdown: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your content...',
  className
}: RichTextEditorProps) {
  // Convert initial markdown to HTML for the editor (only on mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialHtml = React.useMemo(() => markdownToHtml(content), [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: { class: 'list-disc pl-6' },
        },
        orderedList: {
          HTMLAttributes: { class: 'list-decimal pl-6' },
        },
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: { class: 'bg-muted p-4 rounded-lg font-mono text-sm' },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[250px] p-4',
      },
    },
  })

  // Update editor content when external content changes (e.g., switching tabs)
  React.useEffect(() => {
    if (editor && content !== htmlToMarkdown(editor.getHTML())) {
      const html = markdownToHtml(content)
      editor.commands.setContent(html)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          tooltip="Bold (Cmd+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          tooltip="Italic (Cmd+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          tooltip="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          isActive={editor.isActive('link')}
          tooltip="Add Link"
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          tooltip="Remove Link"
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          tooltip="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          tooltip="Undo (Cmd+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          tooltip="Redo (Cmd+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="tiptap" />
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  tooltip: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, disabled, tooltip, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isActive && 'bg-accent')}
          onClick={onClick}
          disabled={disabled}
          type="button"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{tooltip}</span>
      </TooltipContent>
    </Tooltip>
  )
}
