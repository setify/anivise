'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Pencil, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AvatarDisplay } from '@/components/shared/avatar-display'
import {
  addAnalysisComment,
  updateAnalysisComment,
  deleteAnalysisComment,
} from '../actions'
import type { AnalysisCommentRow } from '../actions'

interface CommentFeedProps {
  analysisId: string
  comments: AnalysisCommentRow[]
  currentUserId: string
}

export function CommentFeed({
  analysisId,
  comments,
  currentUserId,
}: CommentFeedProps) {
  const t = useTranslations('analyses.detail.notes')
  const [newComment, setNewComment] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  async function handleAdd() {
    if (!newComment.trim()) return
    setAdding(true)
    const result = await addAnalysisComment(analysisId, newComment.trim())
    setAdding(false)
    if (result.success) {
      setNewComment('')
    }
  }

  async function handleUpdate(commentId: string) {
    if (!editContent.trim()) return
    await updateAnalysisComment(commentId, editContent.trim())
    setEditId(null)
    setEditContent('')
  }

  async function handleDelete(commentId: string) {
    await deleteAnalysisComment(commentId)
  }

  function formatTime(date: Date) {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* Add comment */}
      <div className="space-y-2">
        <Textarea
          placeholder={t('placeholder')}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAdd()
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={adding || !newComment.trim()}
          >
            {adding ? t('adding') : t('add')}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center py-4">
          <MessageSquare className="text-muted-foreground mb-2 size-6" />
          <p className="text-muted-foreground text-xs">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-3">
              <AvatarDisplay
                name={comment.authorName}
                avatarUrl={comment.authorAvatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.authorName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatTime(comment.createdAt)}
                  </span>
                  {comment.updatedAt > comment.createdAt && (
                    <span className="text-muted-foreground text-xs italic">
                      ({t('edited')})
                    </span>
                  )}
                </div>
                {editId === comment.id ? (
                  <div className="mt-1 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditId(null)}
                      >
                        {t('editCancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(comment.id)}
                      >
                        {t('editSave')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">
                    {comment.content}
                  </p>
                )}
              </div>
              {comment.isOwn && editId !== comment.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => {
                      setEditId(comment.id)
                      setEditContent(comment.content)
                    }}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
