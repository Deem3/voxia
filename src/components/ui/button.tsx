import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent",
    "bg-clip-padding text-xs font-medium whitespace-nowrap",
    "transition-all duration-150 ease-out outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-signal/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
    "active:not-aria-[haspopup]:scale-[0.97] active:not-aria-[haspopup]:brightness-95",
    "disabled:pointer-events-none disabled:opacity-40",
    "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:brightness-110 hover:shadow-[0_2px_10px_color-mix(in_oklab,var(--primary)_20%,transparent)]",
        ],
        signal: [
          "bg-signal text-signal-foreground",
          "hover:brightness-110 hover:shadow-[0_2px_12px_color-mix(in_oklab,var(--signal)_35%,transparent)]",
          "focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--signal)_25%,transparent)]",
        ],
        outline: [
          "border-border bg-background hover:bg-muted hover:text-foreground",
          "hover:border-foreground/25 transition-colors",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/70",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ],
        ghost: [
          "hover:bg-muted/80 hover:text-foreground",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:hover:bg-muted/40",
        ],
        destructive: [
          "bg-destructive/10 text-destructive",
          "hover:bg-destructive/20",
          "focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
          "dark:bg-destructive/20 dark:hover:bg-destructive/30",
        ],
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
