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
        "rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          {title ? <h2 className="text-lg font-bold tracking-tight">{title}</h2> : <div />}
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[var(--accent)] text-white hover:bg-blue-600 shadow-sm",
        variant === "soft" && "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-blue-100",
        variant === "ghost" && "border border-[var(--line)] bg-white hover:bg-slate-50",
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
}: PropsWithChildren<{ tone?: "neutral" | "accent" | "warn" | "danger" | "info" | "success" }>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "neutral" && "bg-slate-100 text-slate-700",
        tone === "accent" && "bg-blue-50 text-blue-700",
        tone === "warn" && "bg-amber-50 text-amber-700",
        tone === "danger" && "bg-rose-50 text-rose-700",
        tone === "info" && "bg-cyan-50 text-cyan-700",
        tone === "success" && "bg-emerald-50 text-emerald-700",
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
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-sm text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/70 px-6 py-10 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

export function priorityTone(
  priority: string,
): "neutral" | "accent" | "warn" | "danger" | "info" | "success" {
  if (priority === "critica" || priority === "critical") return "danger";
  if (priority === "alta" || priority === "high") return "warn";
  if (priority === "baixa" || priority === "low") return "info";
  return "neutral";
}

export const PRIORITY_LABEL: Record<string, string> = {
  baixa: "Low",
  media: "Medium",
  alta: "High",
  critica: "Critical",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
