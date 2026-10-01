"use client"

// Shared building blocks for the editorial look: ink pill buttons, quiet
// fields with sentence-case labels, segmented pills, selectable option
// cards, and hairline-divided sections. Prefer these over hand-rolled
// class strings so screens stay consistent.

import { forwardRef } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

// ── Buttons ────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "icon"

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background disabled:pointer-events-none"

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:   "bg-primary text-primary-foreground hover:bg-primary/85 disabled:bg-on-surface-variant/35",
  secondary: "border border-outline-variant text-on-surface hover:bg-surface-container-low disabled:opacity-50",
  ghost:     "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low disabled:opacity-50",
  danger:    "border border-error/30 text-error hover:bg-error-container disabled:opacity-50",
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm:   "h-8 px-3.5 text-[13px]",
  md:   "h-10 px-5 text-sm",
  icon: "h-9 w-9",
}

export function buttonCls(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props }, ref,
) {
  return <button ref={ref} type={type} className={buttonCls(variant, size, className)} {...props} />
})

/** Underlined text link style, as in the reference's "Preview". */
export const linkCls = "text-on-surface underline underline-offset-4 decoration-on-surface/30 hover:decoration-on-surface"

// ── Fields ─────────────────────────────────────────────────────────────────

const FIELD_BASE =
  "w-full rounded-lg border border-outline-variant bg-surface-container text-sm text-on-surface " +
  "placeholder:text-on-surface-variant/70 transition-colors focus:outline-none focus:border-on-surface/40 " +
  "focus:ring-2 focus:ring-ring/10 disabled:opacity-60"

/** Inputs and selects. */
export const fieldCls = cx(FIELD_BASE, "h-10 px-3.5")
/** Compact variant for dense toolbars and popovers. */
export const fieldSmCls = cx(FIELD_BASE, "h-9 px-3 text-[13px]")
export const textareaCls = cx(FIELD_BASE, "px-3.5 py-2.5 leading-relaxed resize-none")

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="text-[13px] text-on-surface-variant">{children}</label>
}

export function Field({ label, hint, children, className }: {
  label?: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="text-xs text-on-surface-variant leading-relaxed">{hint}</p>}
    </div>
  )
}

// ── Segmented pills ────────────────────────────────────────────────────────

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

export function SegmentedControl<T extends string>({ options, value, onChange, className, ariaLabel }: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cx("inline-flex items-center gap-0.5 p-1 rounded-full border border-outline-variant", className)}>
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap",
              active ? "bg-primary text-primary-foreground" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Option cards (Draft / Published / Archived style) ─────────────────────

export function OptionCard({ selected, title, description, onClick, disabled }: {
  selected: boolean
  title: ReactNode
  description?: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "text-left rounded-xl border p-4 transition-colors disabled:cursor-default",
        selected
          ? "bg-primary border-primary text-primary-foreground"
          : "border-outline-variant text-on-surface hover:border-on-surface/30",
      )}
    >
      <span className="block text-[15px] font-medium">{title}</span>
      {description && (
        <span className={cx("block mt-1 text-[13px] leading-snug", selected ? "text-primary-foreground/65" : "text-on-surface-variant")}>
          {description}
        </span>
      )}
    </button>
  )
}

// ── Page and section structure ─────────────────────────────────────────────

export function PageHeader({ title, subtitle, actions }: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-[28px] text-on-surface">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/** A titled block followed by a hairline, like the reference's form sections. */
export function Section({ title, description, action, children, className }: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx("py-8 border-b border-border last:border-b-0 flex flex-col gap-5", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            {title && <h2 className="text-[22px] text-on-surface">{title}</h2>}
            {description && <p className="text-sm text-on-surface-variant">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatTile({ label, value, note }: { label: ReactNode; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-5">
      <span className="text-[13px] text-on-surface-variant">{label}</span>
      <span className="text-[34px] leading-none font-semibold tracking-tight text-on-surface">{value}</span>
      {note && <span className="text-[13px] text-on-surface-variant">{note}</span>}
    </div>
  )
}

/** Outlined tag; ink-filled when `active`. */
export function Pill({ children, active, onClick, className }: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  const cls = cx(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
    active ? "bg-primary border-primary text-primary-foreground" : "border-outline-variant text-on-surface-variant",
    onClick && !active && "hover:border-on-surface/30 hover:text-on-surface",
    className,
  )
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={active} className={cls}>{children}</button>
    : <span className={cls}>{children}</span>
}

/** Error / notice text. */
export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-[13px] text-error">{children}</p>
}

// ── Avatar ─────────────────────────────────────────────────────────────────

/**
 * Plain <img>, deliberately not next/image: the default DiceBear avatars are
 * SVGs, which next/image refuses to serve unless SVG is globally allowed.
 */
export function Avatar({ src, name, size = 32, className }: {
  src?: string | null
  name: string
  size?: number
  className?: string
}) {
  const url = src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "user")}`
  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cx("rounded-full object-cover bg-surface-container-low border border-border flex-shrink-0", className)}
    />
  )
}
