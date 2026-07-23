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

function songMeta(song: Song): string {
  return [
    song.key ? `Key ${song.key}` : "Key 미확인",
    song.bpm ? `${song.bpm} BPM` : "BPM 미확인",
    song.timeSignature ?? "박자 미확인",
  ].join(" · ");
}

function sourceName(song: Song): string {
  if (song.sources?.length) {
    return song.sources.length === 1 ? song.sources[0].name : `${song.sources[0].name} 외 ${song.sources.length - 1}건`;
  }
  return song.sourceName ?? "출처 정보 없음";
}

export function GeneratorSelection(props: Props) {
  return <aside className="selection-shell studio-selection" aria-label="가수와 대표곡 선택">
    <div className="selection-top">
      <div>
        <p className="panel-eyebrow">SELECT</p>
        <h2>가수와 대표곡 선택</h2>
        <p>가수를 고른 뒤 참고할 대표곡을 선택하세요.</p>
      </div>
      <button type="button" onClick={props.onGenerate} disabled={!props.canGenerate} className="generate-button selection-generate-button">
        {props.loadingTarget === "all" ? <RefreshIcon className="size-5 animate-spin"/> : <SparklesIcon className="size-5"/>}
        <span>{props.loadingTarget === "all" ? "만드는 중" : props.selectedSong ? "전체 만들기" : "곡 선택 후 만들기"}</span>
      </button>
    </div>

    <div className="selection-content">
      <section className="selection-block">
        <div className="selection-label"><span>1</span><strong>가수</strong></div>
        <label className="search-field"><SearchIcon className="size-4 text-slate-400"/><span className="sr-only">가수 검색</span><input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="가수 이름 검색"/></label>
        <div className="artist-grid" role="listbox" aria-label="가수 목록">
          {props.artists.map((artist) => {
            const verifiedCount = artist.songs.filter((song) => song.verified).length;
            return <button key={artist.id} type="button" role="option" aria-selected={props.artistId === artist.id} onClick={() => props.onArtist(artist.id)} className={`artist-item ${props.artistId === artist.id ? "selected" : ""}`}>
              <span className="artist-avatar">{artist.name.slice(0, 1)}</span>
              <span className="min-w-0 flex-1 text-left"><strong>{artist.name}</strong><small>{artist.songs.length}곡 · {artist.demo ? "데모" : `${verifiedCount}곡 검수`}</small></span>
              {props.artistId === artist.id ? <CheckIcon className="size-4 text-blue-600"/> : <ChevronIcon className="size-4 text-slate-300"/>}
            </button>;
          })}
        </div>
      </section>

      <section className="selection-block song-selection-block">
        <div className="selection-label"><span>2</span><strong>대표곡</strong></div>
        {!props.selectedArtist ? <div className="selection-empty"><MusicIcon className="size-7"/><p>먼저 가수를 선택해 주세요.</p></div> : <div className="song-list">
          {props.selectedArtist.songs.map((song) => <button key={song.id} type="button" onClick={() => props.onSong(song.id)} className={`song-item ${props.songId === song.id ? "selected" : ""}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><MusicIcon className="size-4.5"/></span>
            <span className="min-w-0 flex-1 text-left"><strong>{song.title}</strong><small>{songMeta(song)}</small></span>
            <span className={`verify-badge ${song.verified ? "verified" : ""}`}>{song.verified ? "검수" : "미검수"}</span>
          </button>)}
        </div>}
      </section>

      {props.selectedSong && <div className="source-box compact-source-box"><div><strong>출처</strong><span>{sourceName(props.selectedSong)}</span></div><div><strong>상태</strong><span>{props.selectedSong.verified ? "검수 완료" : "검수 전"}</span></div></div>}
    </div>
  </aside>;
}
