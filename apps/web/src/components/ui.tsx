import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export function Panel({
  children,
  className,
  title,
  action,
}: PropsWithChildren<{ className?: string; title?: string; action?: ReactNode }>) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-[var(--line)] bg-[var(--bg-elevated)]/90 shadow-[var(--shadow)] backdrop-blur",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          {title ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : <div />}
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "soft";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-[var(--accent)] text-white hover:brightness-110",
        variant === "soft" && "bg-[var(--accent-soft)] text-[var(--accent)] hover:brightness-95",
        variant === "ghost" && "border border-[var(--line)] bg-transparent hover:bg-black/5",
        variant === "danger" && "bg-[var(--danger)] text-white hover:brightness-110",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
}: PropsWithChildren<{ tone?: "neutral" | "accent" | "warn" | "danger" | "info" }>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]",
        tone === "neutral" && "bg-[#ece4d6] text-[var(--ink)]",
        tone === "accent" && "bg-[var(--accent-soft)] text-[var(--accent)]",
        tone === "warn" && "bg-[#fde68a] text-[var(--warn)]",
        tone === "danger" && "bg-[#fecdd3] text-[var(--danger)]",
        tone === "info" && "bg-[#dbeafe] text-[var(--info)]",
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 font-[Fraunces] text-3xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-sm text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--line)] px-6 py-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

export function priorityTone(priority: string): "neutral" | "accent" | "warn" | "danger" | "info" {
  if (priority === "critica") return "danger";
  if (priority === "alta") return "warn";
  if (priority === "baixa") return "info";
  return "neutral";
}
