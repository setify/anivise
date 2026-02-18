"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base layout
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Inaktiv: weißer Background, sichtbarer Rahmen
        "border-2 border-input bg-white",
        "dark:bg-muted dark:border-muted-foreground/40",
        // Aktiv: Primary Background, Rahmen in Primary
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full shadow-sm",
          "transition-transform duration-200",
          // Position
          "data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:translate-x-5",
          // Inaktiv: grauer Kreis
          "bg-muted-foreground/40",
          "dark:bg-muted-foreground/60",
          // Aktiv: weißer Kreis
          "data-[state=checked]:bg-white",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
