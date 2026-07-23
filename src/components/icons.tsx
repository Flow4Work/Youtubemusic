import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function MusicIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>;
}
export function CopyIcon(props: IconProps) {
  return <svg {...base} {...props}><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
}
export function RefreshIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"/></svg>;
}
export function HistoryIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
}
export function SearchIcon(props: IconProps) {
  return <svg {...base} {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
}
export function ChevronIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m9 18 6-6-6-6"/></svg>;
}
export function SparklesIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>;
}
export function CloseIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
export function TrashIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>;
}
export function CheckIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m20 6-11 11-5-5"/></svg>;
}
export function ArrowUpIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m18 15-6-6-6 6"/></svg>;
}
export function ArrowDownIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m6 9 6 6 6-6"/></svg>;
}
