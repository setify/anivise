import { toast } from 'sonner'

interface UndoableAction<T> {
  execute: () => Promise<T>
  undo: () => Promise<void>
  successMessage: string
  undoMessage?: string
  errorMessage?: string
}

export async function executeWithUndo<T>(action: UndoableAction<T>): Promise<T> {
  const result = await action.execute()

  toast.success(action.successMessage, {
    action: {
      label: 'Undo',
      onClick: async () => {
        try {
          await action.undo()
          toast.info(action.undoMessage ?? 'Action undone.')
        } catch {
          toast.error('Failed to undo action.')
        }
      },
    },
    duration: 8000,
  })

  return result
}
