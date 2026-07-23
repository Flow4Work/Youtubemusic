import { CheckIcon, ChevronIcon, MusicIcon, RefreshIcon, SearchIcon, SparklesIcon } from "@/components/icons";
import type { Artist, GenerationTarget, Song } from "@/lib/types";

interface Props {
  artists: Artist[];
  artistId: string;
  songId: string;
  query: string;
  selectedArtist: Artist | null;
  selectedSong: Song | null;
  canGenerate: boolean;
  loadingTarget: GenerationTarget | null;
  onQuery: (value: string) => void;
  onArtist: (id: string) => void;
  onSong: (id: string) => void;
  onGenerate: () => void;
}

export function GeneratorSelection(props: Props) {
  return <section className="selection-shell" aria-label="노래 생성 선택 단계">
    <div className="selection-panel">
      <div className="step-heading"><span className="step-number">1</span><div><h2>가수 선택</h2><p>원하는 창작 방향과 가까운 가수를 고르세요.</p></div></div>
      <label className="search-field"><SearchIcon className="size-4 text-slate-400"/><span className="sr-only">가수 검색</span><input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="가수 이름 검색"/></label>
      <div className="artist-grid" role="listbox" aria-label="가수 목록">
        {props.artists.map((artist) => <button key={artist.id} type="button" role="option" aria-selected={props.artistId === artist.id} onClick={() => props.onArtist(artist.id)} className={`artist-item ${props.artistId === artist.id ? "selected" : ""}`}>
          <span className="artist-avatar">{artist.name.slice(0, 1)}</span>
          <span className="min-w-0 flex-1 text-left"><strong>{artist.name}</strong><small>{artist.songs.length}곡 · {artist.demo ? "데모" : "검수 완료"}</small></span>
          {props.artistId === artist.id ? <CheckIcon className="size-4 text-blue-600"/> : <ChevronIcon className="size-4 text-slate-300"/>}
        </button>)}
      </div>
    </div>

    <div className="selection-panel border-t border-slate-200 lg:border-t-0 lg:border-l">
      <div className="step-heading"><span className="step-number">2</span><div><h2>대표곡 선택</h2><p>검수된 곡의 기본 구조만 창작 참고자료로 사용합니다.</p></div></div>
      {!props.selectedArtist ? <div className="empty-state"><MusicIcon className="size-8"/><p>먼저 가수를 선택해 주세요.</p></div> : <div className="space-y-3">
        {props.selectedArtist.songs.map((song) => <button key={song.id} type="button" onClick={() => props.onSong(song.id)} className={`song-item ${props.songId === song.id ? "selected" : ""}`}>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><MusicIcon className="size-5"/></span>
          <span className="min-w-0 flex-1 text-left"><strong>{song.title}</strong><small>Key {song.key} · {song.bpm} BPM · {song.timeSignature}</small></span>
          <span className={`verify-badge ${song.verified ? "verified" : ""}`}>{song.verified ? "검수 완료" : "검수 전"}</span>
        </button>)}
        {props.selectedSong && <div className="source-box"><div><strong>데이터 출처</strong><span>{props.selectedSong.sourceName}</span></div><div><strong>라이선스</strong><span>{props.selectedSong.license}</span></div></div>}
      </div>}
    </div>

    <div className="generate-panel">
      <div className="step-heading"><span className="step-number">3</span><div><h2>한 번에 만들기</h2><p>API 요청은 한 번만 실행하고 결과 4종을 함께 표시합니다.</p></div></div>
      <button type="button" onClick={props.onGenerate} disabled={!props.canGenerate} className="generate-button">
        {props.loadingTarget === "all" ? <RefreshIcon className="size-5 animate-spin"/> : <SparklesIcon className="size-5"/>}
        {props.loadingTarget === "all" ? "새 노래 자료 만드는 중" : "새 노래 자료 만들기"}
      </button>
      {!props.selectedSong && <p className="mt-3 text-center text-xs text-slate-500">대표곡을 선택하면 버튼이 활성화됩니다.</p>}
    </div>
  </section>;
}
