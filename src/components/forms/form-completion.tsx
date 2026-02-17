'use client'

import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormCompletionProps {
  type: 'thank_you' | 'redirect'
  title?: string | null
  message?: string | null
  redirectUrl?: string | null
}

export function FormCompletion({ type, title, message, redirectUrl }: FormCompletionProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setShow(true), 100)

    // Handle redirect
    if (type === 'redirect' && redirectUrl) {
      const redirectTimer = setTimeout(() => {
        window.location.href = redirectUrl
      }, 1500)
      return () => {
        clearTimeout(timer)
        clearTimeout(redirectTimer)
      }
    }

    return () => clearTimeout(timer)
  }, [type, redirectUrl])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div
        className={cn(
          'text-center transition-all duration-700',
          show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        <div
          className={cn(
            'mx-auto mb-6 flex size-20 items-center justify-center rounded-full transition-all duration-500',
            show ? 'bg-green-100 scale-100 dark:bg-green-900/30' : 'scale-50'
          )}
        >
          <CheckCircle
            className={cn(
              'size-10 text-green-600 transition-all duration-500 dark:text-green-400',
              show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            )}
          />
        </div>

        <h2 className="text-2xl font-bold">
          {title || 'Thank you!'}
        </h2>

        {message && (
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-base">
            {message}
          </p>
        )}

        {type === 'redirect' && redirectUrl && (
          <p className="text-muted-foreground mt-6 text-sm">
            Redirecting...
          </p>
        )}
      </div>
    </div>
  )
}
