import * as React from "react"

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type Size = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  outline: "border border-border bg-background hover:bg-muted hover:text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-muted hover:text-foreground",
  destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  link: "text-primary underline-offset-4 hover:underline",
}

const sizeClasses: Record<Size, string> = {
  default: "h-8 gap-1.5 px-2.5",
  xs: "h-6 gap-1 rounded-[10px] px-2 text-xs",
  sm: "h-7 gap-1 rounded-[12px] px-2.5 text-[0.8rem]",
  lg: "h-9 gap-1.5 px-2.5",
  icon: "size-8",
  "icon-xs": "size-6 rounded-[10px]",
  "icon-sm": "size-7 rounded-[12px]",
  "icon-lg": "size-9",
}

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: Variant
  size?: Size
}

function buttonVariants(opts?: { variant?: Variant; size?: Size; className?: string }): string {
  const v = opts?.variant ?? "default"
  const s = opts?.size ?? "default"
  return [
    "inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50",
    variantClasses[v],
    sizeClasses[s],
    opts?.className ?? "",
  ]
    .filter(Boolean)
    .join(" ")
}

function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
