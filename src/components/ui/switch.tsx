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
        // group/switch: lets the Thumb read parent data-state via group-data-[]
        "group/switch",
        // Base layout
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Track: immer weißer Hintergrund
        "border-2 bg-white dark:bg-muted",
        // Inaktiv: dezenter Rahmen
        "border-input dark:border-muted-foreground/40",
        // Aktiv: Primary-Rahmen
        "group-data-[state=checked]/switch:border-primary",
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
          "translate-x-0 group-data-[state=checked]/switch:translate-x-5",
          // Inaktiv: grauer Kreis
          "bg-muted-foreground/40 dark:bg-muted-foreground/60",
          // Aktiv: Primary-Kreis
          "group-data-[state=checked]/switch:bg-primary",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
