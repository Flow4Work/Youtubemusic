import { ArrowDownIcon, ArrowUpIcon, CheckIcon, SparklesIcon } from "@/components/icons";
import { CardHeader, SkeletonCard } from "@/components/generator-common";
import { sectionLabel } from "@/lib/chords";
import type { ChordResult, GeneratedPayload, GenerationTarget } from "@/lib/types";

interface Props {
  result: GeneratedPayload | null;
  chords: ChordResult | null;
  loading: GenerationTarget | null;
  simplified: boolean;
  lyricsTab: "a" | "b";
  copied: string;
  providerName: string;
  onGenerate: (target: GenerationTarget) => void;
  onCopy: (key: string, text: string) => void;
  onTranspose: (value: number) => void;
  onSimplified: () => void;
  onLyricsTab: (tab: "a" | "b") => void;
}

function chordText(result: ChordResult): string {
  const sections = Object.entries(result.sections).map(([name, chords]) => `[${sectionLabel[name] ?? name}] ${chords.join(" | ")}`).join("\n");
  return `Key ${result.key} · ${result.bpm} BPM · ${result.timeSignature}\n\n${sections}`;
}

export function GeneratorResults(props: Props) {
  const { result, chords, loading } = props;
  return <section className="mt-8" aria-label="생성 결과">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-bold text-blue-600">RESULT</p><h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">창작 자료 4종</h2></div>
      {result && <div className="flex items-center gap-2 text-xs text-slate-500"><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{props.providerName} 생성</span><span>{new Date(result.generatedAt).toLocaleString("ko-KR")}</span></div>}
    </div>

    {loading === "all" && !result ? <div className="result-grid"><SkeletonCard/><SkeletonCard/><SkeletonCard/><SkeletonCard/></div> : result && chords ? <div className="result-grid">
      <article className="result-card">
        <CardHeader eyebrow="01 · CHORD" title="창작용 코드" copy={() => props.onCopy("chords", chordText(chords))} regenerate={() => props.onGenerate("chords")} busy={loading === "chords"}/>
        <div className="mt-5 flex flex-wrap gap-2"><span className="metric-pill">Key {chords.key}</span><span className="metric-pill">{chords.bpm} BPM</span><span className="metric-pill">{chords.timeSignature}</span></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="mini-button" onClick={() => props.onTranspose(-1)}><ArrowDownIcon className="size-3.5"/> 반음 내리기</button>
          <button type="button" className="mini-button" onClick={() => props.onTranspose(1)}><ArrowUpIcon className="size-3.5"/> 반음 올리기</button>
          <button type="button" className={`mini-button ${props.simplified ? "active" : ""}`} onClick={props.onSimplified}>쉬운 코드</button>
        </div>
        <div className="result-scroll mt-5 space-y-3">{Object.entries(chords.sections).map(([name, values]) => <div key={name} className="chord-section"><div className="flex items-center justify-between gap-2"><strong>{sectionLabel[name] ?? name}</strong><button type="button" onClick={() => props.onCopy(`section-${name}`, values.join(" | "))} className="text-xs font-semibold text-slate-500 hover:text-blue-600">{props.copied === `section-${name}` ? "복사됨" : "복사"}</button></div><p>{values.join(" | ")}</p></div>)}</div>
        {props.copied === "chords" && <p className="copied-toast">코드 전체를 복사했습니다.</p>}
      </article>

      <article className="result-card">
        <CardHeader eyebrow="02 · SUNO STYLE" title="Suno 스타일" copy={() => props.onCopy("style", result.sunoStyle)} regenerate={() => props.onGenerate("style")} busy={loading === "style"}/>
        <div className="result-scroll mt-5"><p className="whitespace-pre-wrap text-[14px] leading-7 text-slate-700">{result.sunoStyle}</p><div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">특정 가수의 목소리나 원곡을 복제하지 않고 장르와 편곡 요소만 창작 참고로 사용합니다.</div></div>
        {props.copied === "style" && <p className="copied-toast">Suno 스타일을 복사했습니다.</p>}
      </article>

      <article className="result-card">
        <CardHeader eyebrow="03 · LYRICS" title="가사 A안, B안" copy={() => props.onCopy("lyrics", result.lyrics[props.lyricsTab])} regenerate={() => props.onGenerate("lyrics")} busy={loading === "lyrics"}/>
        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">{(["a", "b"] as const).map((tab) => <button key={tab} type="button" onClick={() => props.onLyricsTab(tab)} className={`lyrics-tab ${props.lyricsTab === tab ? "active" : ""}`}>{tab.toUpperCase()}안 {props.lyricsTab === tab && <CheckIcon className="size-3.5"/>}</button>)}</div>
        <pre className="result-scroll lyrics-pre mt-4">{result.lyrics[props.lyricsTab]}</pre>
        {props.copied === "lyrics" && <p className="copied-toast">선택한 가사를 복사했습니다.</p>}
      </article>

      <article className="result-card">
        <CardHeader eyebrow="04 · PUBLISH" title="제목과 해시태그" copy={() => props.onCopy("publish", `${result.titles.join("\n")}\n\n${result.hashtags.join(" ")}`)} regenerate={() => props.onGenerate("titles")} busy={loading === "titles" || loading === "hashtags"}/>
        <div className="result-scroll mt-5">
          <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-slate-950">제목 후보 3개</h4><button type="button" onClick={() => props.onGenerate("titles")} disabled={Boolean(loading)} className="text-xs font-bold text-blue-600 disabled:opacity-40">제목만 다시</button></div>
          <ol className="mt-3 space-y-2">{result.titles.map((title, index) => <li key={`${title}-${index}`} className="title-row"><span>{index + 1}</span><strong>{title}</strong><button type="button" onClick={() => props.onCopy(`title-${index}`, title)}>{props.copied === `title-${index}` ? "완료" : "복사"}</button></li>)}</ol>
          <div className="mt-6 flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-slate-950">해시태그 8개</h4><button type="button" onClick={() => props.onGenerate("hashtags")} disabled={Boolean(loading)} className="text-xs font-bold text-blue-600 disabled:opacity-40">태그만 다시</button></div>
          <div className="mt-3 flex flex-wrap gap-2">{result.hashtags.map((tag) => <button type="button" key={tag} onClick={() => props.onCopy(tag, tag)} className="hashtag">{tag}</button>)}</div>
        </div>
        {props.copied === "publish" && <p className="copied-toast">제목과 해시태그를 복사했습니다.</p>}
      </article>
    </div> : <div className="results-empty"><span><SparklesIcon className="size-7"/></span><h3>선택을 마치면 결과가 여기에 나타납니다.</h3><p>코드, Suno 스타일, 가사 2안, 제목과 해시태그를 한 번에 확인할 수 있습니다.</p></div>}
  </section>;
}
