"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group-[.toaster]:!rounded-full group-[.toaster]:!px-5 group-[.toaster]:!py-3 group-[.toaster]:!shadow-md group-[.toaster]:!border group-[.toaster]:!gap-2 group-[.toaster]:!items-center",
          title: "group-[.toaster]:!text-sm group-[.toaster]:!font-medium",
          description: "group-[.toaster]:!text-xs",
          success:
            "group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-900 group-[.toaster]:!border-emerald-200 dark:group-[.toaster]:!bg-emerald-950 dark:group-[.toaster]:!text-emerald-100 dark:group-[.toaster]:!border-emerald-800",
          error:
            "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900 group-[.toaster]:!border-red-200 dark:group-[.toaster]:!bg-red-950 dark:group-[.toaster]:!text-red-100 dark:group-[.toaster]:!border-red-800",
          warning:
            "group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-900 group-[.toaster]:!border-amber-200 dark:group-[.toaster]:!bg-amber-950 dark:group-[.toaster]:!text-amber-100 dark:group-[.toaster]:!border-amber-800",
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-900 group-[.toaster]:!border-blue-200 dark:group-[.toaster]:!bg-blue-950 dark:group-[.toaster]:!text-blue-100 dark:group-[.toaster]:!border-blue-800",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />,
        info: <InfoIcon className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />,
        error: <OctagonXIcon className="size-4 shrink-0 text-red-600 dark:text-red-400" />,
        loading: <Loader2Icon className="size-4 shrink-0 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
