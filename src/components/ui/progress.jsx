import * as React from "react"
import { motion as Motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value = 0, indicatorClassName, ...props }, ref) => {
  const clampedValue = Math.min(Math.max(Number(value) || 0, 0), 100)

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedValue}
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <Motion.div
        className={cn("h-full w-full flex-1 rounded-full bg-primary", indicatorClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
