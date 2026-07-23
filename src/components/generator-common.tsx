import type { ReactNode } from "react";
import { CopyIcon, RefreshIcon } from "@/components/icons";

export function ActionButton({ onClick, label, children, disabled = false }: { onClick: () => void; label: string; children: ReactNode; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="icon-button">{children}</button>;
}

export function CardHeader({ eyebrow, title, copy, regenerate, busy }: { eyebrow: string; title: string; copy: () => void; regenerate: () => void; busy: boolean }) {
  return <div className="flex items-start justify-between gap-3">
    <div><p className="text-xs font-semibold tracking-[0.14em] text-blue-600 uppercase">{eyebrow}</p><h3 className="mt-1 text-lg font-bold tracking-[-0.02em] text-slate-950">{title}</h3></div>
    <div className="flex gap-1.5">
      <ActionButton onClick={copy} label={`${title} 복사`}><CopyIcon className="size-4" /></ActionButton>
      <ActionButton onClick={regenerate} label={`${title} 다시 생성`} disabled={busy}><RefreshIcon className={`size-4 ${busy ? "animate-spin" : ""}`} /></ActionButton>
    </div>
  </div>;
}

export function SkeletonCard() {
  return <div className="result-card animate-pulse" aria-hidden="true"><div className="h-5 w-28 rounded-full bg-slate-200"/><div className="mt-6 space-y-3"><div className="h-4 rounded-full bg-slate-100"/><div className="h-4 w-5/6 rounded-full bg-slate-100"/><div className="h-4 w-4/6 rounded-full bg-slate-100"/><div className="h-24 rounded-2xl bg-slate-100"/></div></div>;
}
