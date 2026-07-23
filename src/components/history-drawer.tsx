import { CloseIcon, HistoryIcon, TrashIcon } from "@/components/icons";
import { ActionButton } from "@/components/generator-common";
import type { GeneratedPayload } from "@/lib/types";

interface Props {
  open: boolean;
  history: GeneratedPayload[];
  onClose: () => void;
  onLoad: (item: GeneratedPayload) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistoryDrawer({ open, history, onClose, onLoad, onRemove, onClear }: Props) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="최근 결과">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5"><div><h2 className="text-lg font-extrabold text-slate-950">최근 결과</h2><p className="text-xs text-slate-500">최대 20개, 현재 브라우저에만 저장</p></div><ActionButton onClick={onClose} label="최근 결과 닫기"><CloseIcon className="size-5"/></ActionButton></div>
      <div className="flex-1 overflow-y-auto p-4">
        {history.length === 0 ? <div className="empty-state h-full"><HistoryIcon className="size-8"/><p>저장된 결과가 없습니다.</p></div> : <div className="space-y-3">{history.map((item) => <div key={item.id} className="history-item">
          <button type="button" onClick={() => onLoad(item)} className="min-w-0 flex-1 text-left"><strong>{item.titles[0]}</strong><span>{item.artistName} · {item.songTitle}</span><small>{new Date(item.generatedAt).toLocaleString("ko-KR")} · {item.provider.toUpperCase()}</small></button>
          <ActionButton onClick={() => onRemove(item.id)} label="이 기록 삭제"><TrashIcon className="size-4"/></ActionButton>
        </div>)}</div>}
      </div>
      {history.length > 0 && <div className="border-t border-slate-200 p-4"><button type="button" onClick={onClear} className="danger-button"><TrashIcon className="size-4"/> 전체 기록 삭제</button></div>}
    </aside>
  </div>;
}
