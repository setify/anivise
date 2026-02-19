'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  Bell,
  Trash2,
  Loader2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { AssignFormDialog } from './assign-form-dialog'
import { FormResponsesView } from './form-responses-view'
import {
  sendFormReminder,
  removeFormAssignment,
} from '../form-assignment-actions'
import type { FormAssignmentRow } from '../form-assignment-actions'

interface FormsSectionProps {
  analysisId: string
  formAssignments: FormAssignmentRow[]
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  opened:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export function FormsSection({
  analysisId,
  formAssignments,
}: FormsSectionProps) {
  const t = useTranslations('analyses.detail.forms')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [assignOpen, setAssignOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [removeOpen, setRemoveOpen] = useState<string | null>(null)
  const [remindingId, setRemindingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  function formatDate(date: Date | null) {
    if (!date) return ''
    return new Date(date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function isOverdue(assignment: FormAssignmentRow): boolean {
    if (assignment.status === 'completed') return false
    if (!assignment.dueDate) return false
    return new Date() > new Date(assignment.dueDate)
  }

  async function handleRemind(assignmentId: string) {
    setRemindingId(assignmentId)
    const result = await sendFormReminder(assignmentId)
    setRemindingId(null)

    if (result.success) {
      toast.success(t('reminded'))
      router.refresh()
    } else {
      toast.error(t('remindError'))
    }
  }

  async function handleRemove(assignmentId: string) {
    setRemovingId(assignmentId)
    const result = await removeFormAssignment(assignmentId)
    setRemovingId(null)
    setRemoveOpen(null)

    if (result.success) {
      toast.success(t('removed'))
      router.refresh()
    } else if (result.error === 'cannot_remove_completed') {
      toast.error(t('cannotRemoveCompleted'))
    } else {
      toast.error(t('removeError'))
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" />
            {t('title')}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAssignOpen(true)}
          >
            <Plus className="mr-2 size-3.5" />
            {t('assign')}
          </Button>
        </CardHeader>
        <CardContent>
          {formAssignments.length === 0 ? (
            <div className="flex flex-col items-center py-6">
              <ClipboardList className="text-muted-foreground mb-2 size-8" />
              <p className="text-muted-foreground text-sm">{t('empty')}</p>
              <p className="text-muted-foreground mt-1 text-xs">{t('emptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {formAssignments.map((assignment) => {
                const overdue = isOverdue(assignment)
                const expanded = expandedId === assignment.id

                return (
                  <div key={assignment.id} className="rounded-md border">
                    {/* Collapsible row */}
                    <div
                      className="flex cursor-pointer items-center gap-3 p-3"
                      onClick={() =>
                        setExpandedId(expanded ? null : assignment.id)
                      }
                    >
                      <div className="text-muted-foreground shrink-0">
                        {expanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {assignment.formTitle}
                          </span>
                          <Badge
                            variant="secondary"
                            className={
                              overdue
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : STATUS_BADGE_STYLES[assignment.status]
                            }
                          >
                            {overdue
                              ? t('status.overdue')
                              : t(`status.${assignment.status}`)}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                          {assignment.dueDate && (
                            <span className="flex items-center gap-1">
                              {overdue ? (
                                <AlertTriangle className="size-3 text-red-500" />
                              ) : (
                                <Clock className="size-3" />
                              )}
                              {overdue
                                ? t('overdue', { date: formatDate(assignment.dueDate) })
                                : t('dueDate', { date: formatDate(assignment.dueDate) })}
                            </span>
                          )}
                          {assignment.reminderCount > 0 && (
                            <span>
                              {t('sentCount', {
                                count: assignment.reminderCount,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div
                        className="flex shrink-0 items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {assignment.status !== 'completed' &&
                          assignment.status !== 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleRemind(assignment.id)}
                              disabled={remindingId === assignment.id}
                            >
                              {remindingId === assignment.id ? (
                                <Loader2 className="mr-1 size-3 animate-spin" />
                              ) : (
                                <Bell className="mr-1 size-3" />
                              )}
                              {remindingId === assignment.id
                                ? t('reminding')
                                : t('remind')}
                            </Button>
                          )}
                        {assignment.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive size-7"
                            onClick={() => setRemoveOpen(assignment.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {expanded && (
                      <div className="border-t px-3 py-3">
                        {assignment.status === 'completed' &&
                        assignment.submissionData ? (
                          <FormResponsesView
                            data={assignment.submissionData}
                            schema={assignment.formVersionSchema}
                            submittedAt={assignment.submissionSubmittedAt}
                          />
                        ) : (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs font-medium">
                              Status
                            </p>
                            <div className="flex items-center gap-3">
                              {['assigned', 'sent', 'opened', 'completed'].map(
                                (step, i) => {
                                  const stepOrder = {
                                    pending: 0,
                                    sent: 1,
                                    opened: 2,
                                    completed: 3,
                                  }
                                  const currentOrder =
                                    stepOrder[
                                      assignment.status as keyof typeof stepOrder
                                    ] ?? 0
                                  const isActive = i <= currentOrder

                                  return (
                                    <div
                                      key={step}
                                      className="flex items-center gap-1.5"
                                    >
                                      <div
                                        className={`size-2 rounded-full ${
                                          isActive
                                            ? 'bg-primary'
                                            : 'bg-muted-foreground/30'
                                        }`}
                                      />
                                      <span
                                        className={`text-xs ${
                                          isActive
                                            ? 'text-foreground font-medium'
                                            : 'text-muted-foreground'
                                        }`}
                                      >
                                        {t(`timeline.${step}`)}
                                      </span>
                                      {i < 3 && (
                                        <div
                                          className={`h-px w-4 ${
                                            i < currentOrder
                                              ? 'bg-primary'
                                              : 'bg-muted-foreground/30'
                                          }`}
                                        />
                                      )}
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Form Dialog */}
      <AssignFormDialog
        analysisId={analysisId}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() => router.refresh()}
      />

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={removeOpen !== null}
        onOpenChange={() => setRemoveOpen(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('removeConfirm')}</DialogTitle>
            <DialogDescription>{t('removeDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeOpen && handleRemove(removeOpen)}
              disabled={removingId !== null}
            >
              {removingId ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : null}
              {t('remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
