import type { ReactNode } from "react";
import { CopyIcon, RefreshIcon } from "@/components/icons";

export function ActionButton({ onClick, label, children, disabled = false, copy = false }: { onClick: () => void; label: string; children: ReactNode; disabled?: boolean; copy?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`icon-button ${copy ? "copy-action" : ""}`}>{children}</button>;
}

export function CardHeader({ title, copy, regenerate, busy, disabled = busy, disabledLabel }: { title: string; copy: () => void; regenerate: () => void; busy: boolean; disabled?: boolean; disabledLabel?: string }) {
  const regenerateLabel = disabledLabel || `${title} 다시 생성`;
  return <div className="flex shrink-0 items-start justify-between gap-4">
    <h3 className="text-[26px] font-bold tracking-[-0.03em] text-slate-950">{title}</h3>
    <div className="flex gap-2">
      <ActionButton onClick={copy} label={`${title} 복사`} copy><CopyIcon className="size-5" /></ActionButton>
      <ActionButton onClick={regenerate} label={regenerateLabel} disabled={disabled}><RefreshIcon className={`size-5 ${busy ? "animate-spin" : ""}`} /></ActionButton>
    </div>
  </div>;
}

export function SkeletonCard() {
  return <div className="result-card animate-pulse" aria-hidden="true"><div className="h-7 w-36 rounded-full bg-slate-200"/><div className="mt-6 space-y-4"><div className="h-5 rounded-full bg-slate-100"/><div className="h-5 w-5/6 rounded-full bg-slate-100"/><div className="h-5 w-4/6 rounded-full bg-slate-100"/><div className="h-28 rounded-2xl bg-slate-100"/></div></div>;
}
