"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, CopyIcon, SparklesIcon } from "@/components/icons";
import { CardHeader } from "@/components/generator-common";
import layoutStyles from "@/components/generator-results.module.css";
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
  const sections = Object.entries(result.sections)
    .filter(([, values]) => values.length > 0)
    .map(([name, values]) => `[${sectionLabel[name] ?? name}] ${values.join(" | ")}`)
    .join("\n");
  return `Key ${result.key} · ${result.bpm} BPM · ${result.timeSignature}\n\n${sections}`;
}

function cleanLyrics(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s*(\[[^\]]+\]|(verse|pre[- ]?chorus|chorus|bridge|outro|intro)\s*\d*:?\s*)$/iu.test(line))
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function EmptyCard({ text, loading }: { text: string; loading: boolean }) {
  return <div className={`card-empty ${loading ? "loading" : ""}`}>
    <SparklesIcon className={`size-8 ${loading ? "animate-pulse" : ""}`}/>
    <p>{loading ? "결과를 만드는 중입니다." : text}</p>
  </div>;
}

function StaticCardTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="shrink-0"><p className="text-[17px] font-semibold tracking-[0.12em] text-blue-600 uppercase">{eyebrow}</p><h3 className="mt-1 text-[26px] font-bold tracking-[-0.03em] text-slate-950">{title}</h3></div>;
}

export function GeneratorResults(props: Props) {
  const { result, chords, loading } = props;
  const [styleLanguage, setStyleLanguage] = useState<"en" | "ko">("en");
  const isInitialLoading = loading === "all" && !result;
  const selectedLyrics = result ? cleanLyrics(result.lyrics[props.lyricsTab]) : "";
  const englishTitles = result?.titlesEnglish?.length === 3 ? result.titlesEnglish : result?.titles ?? [];

  return <section className={`studio-results ${layoutStyles.resultsGrid}`} aria-label="생성 결과">
    <article className={`result-card code-card ${layoutStyles.codePosition}`}>
      {result && chords ? <>
        <CardHeader eyebrow="03 · CHORD" title="코드" copy={() => props.onCopy("chords", chordText(chords))} regenerate={() => props.onGenerate("chords")} busy={loading === "chords"}/>
        <div className="mt-4 flex shrink-0 flex-wrap gap-2"><span className="metric-pill">Key {chords.key}</span><span className="metric-pill">{chords.bpm} BPM</span><span className="metric-pill">{chords.timeSignature}</span></div>
        <div className="mt-3 flex shrink-0 flex-wrap gap-2">
          <button type="button" className="mini-button" onClick={() => props.onTranspose(-1)}><ArrowDownIcon className="size-4.5"/> 반음 내리기</button>
          <button type="button" className="mini-button" onClick={() => props.onTranspose(1)}><ArrowUpIcon className="size-4.5"/> 반음 올리기</button>
          <button type="button" className={`mini-button ${props.simplified ? "active" : ""}`} onClick={props.onSimplified}>쉬운 코드</button>
        </div>
        <div className="result-scroll mt-4 space-y-3">{Object.entries(chords.sections).filter(([, values]) => values.length > 0).map(([name, values]) => <div key={name} className="chord-section"><div className="flex items-center justify-between gap-3"><strong>{sectionLabel[name] ?? name}</strong><button type="button" onClick={() => props.onCopy(`section-${name}`, values.join(" | "))} className="section-copy-button"><CopyIcon className="size-4.5"/>{props.copied === `section-${name}` ? "완료" : "복사"}</button></div><p>{values.join(" | ")}</p></div>)}</div>
      </> : <><StaticCardTitle eyebrow="03 · CHORD" title="코드"/><div className="flex-1" aria-hidden="true"/></>}
    </article>

    <article className={`result-card style-card ${layoutStyles.styleCompact}`}>
      {result ? <>
        <CardHeader eyebrow="02 · SUNO STYLE" title="Suno에 넣을 스타일" copy={() => props.onCopy("style", result.sunoStyle)} regenerate={() => props.onGenerate("style")} busy={loading === "style"}/>
        <div className="language-toggle shrink-0" aria-label="Suno 스타일 언어 전환">
          <button type="button" onClick={() => setStyleLanguage("en")} className={styleLanguage === "en" ? "active" : ""}>영어</button>
          <button type="button" onClick={() => setStyleLanguage("ko")} className={styleLanguage === "ko" ? "active" : ""}>한국어 뜻</button>
        </div>
        <div className="result-scroll mt-4"><p className="style-copy whitespace-pre-wrap">{styleLanguage === "en" ? result.sunoStyle : result.sunoStyleKorean}</p></div>
        {styleLanguage === "ko" && <p className="translation-note shrink-0">복사 버튼은 Suno 입력용 영어 문장을 복사합니다.</p>}
      </> : <><StaticCardTitle eyebrow="02 · SUNO STYLE" title="Suno에 넣을 스타일"/><EmptyCard text="영어 스타일과 한국어 뜻이 표시됩니다." loading={isInitialLoading}/></>}
    </article>

    <article className={`result-card lyrics-card ${layoutStyles.lyricsPosition}`}>
      {result ? <>
        <CardHeader eyebrow="01 · LYRICS" title="가사" copy={() => props.onCopy("lyrics", selectedLyrics)} regenerate={() => props.onGenerate("lyrics")} busy={loading === "lyrics"}/>
        <div className="mt-4 grid shrink-0 grid-cols-2 rounded-xl bg-slate-100 p-1">{(["a", "b"] as const).map((tab) => <button key={tab} type="button" onClick={() => props.onLyricsTab(tab)} className={`lyrics-tab ${props.lyricsTab === tab ? "active" : ""}`}>{tab.toUpperCase()}안 <small>{tab === "a" ? "긴 가사" : "기본"}</small>{props.lyricsTab === tab && <CheckIcon className="size-4.5"/>}</button>)}</div>
        <pre className="result-scroll lyrics-pre mt-3">{selectedLyrics}</pre>
      </> : <><StaticCardTitle eyebrow="01 · LYRICS" title="가사"/><EmptyCard text="구간명 없이 실제 가사만 표시됩니다." loading={isInitialLoading}/></>}
    </article>

    <div className={`publish-stack ${layoutStyles.publishStack}`}>
      <article className={`result-card compact-result-card title-card ${layoutStyles.titleCard}`}>
        {result ? <>
          <CardHeader eyebrow="04 · TITLE" title="제목" copy={() => props.onCopy("titles", result.titles.join("\n"))} regenerate={() => props.onGenerate("titles")} busy={loading === "titles"}/>
          <ol className="title-list">{result.titles.map((title, index) => <li key={`${title}-${index}`} className="title-row">
            <span className="title-number">{index + 1}</span>
            <span className="title-text"><strong>{title}</strong></span>
            <span className="title-copy-actions">
              <button type="button" onClick={() => props.onCopy(`title-ko-${index}`, title)} className="title-copy-button" aria-label={`${title} 한글 복사`} title="한글 제목 복사"><CopyIcon className="size-5"/><b>한</b></button>
              <button type="button" onClick={() => props.onCopy(`title-en-${index}`, englishTitles[index] ?? title)} className="title-copy-button" aria-label={`${title} 영문 복사`} title="영문 제목 복사"><CopyIcon className="size-5"/><b>EN</b></button>
            </span>
          </li>)}</ol>
        </> : <><StaticCardTitle eyebrow="04 · TITLE" title="제목"/><EmptyCard text="제목 후보 3개가 표시됩니다." loading={isInitialLoading}/></>}
      </article>

      <article className="result-card compact-result-card hashtag-card">
        {result ? <>
          <CardHeader eyebrow="05 · HASHTAG" title="해시태그" copy={() => props.onCopy("hashtags", result.hashtags.join(" "))} regenerate={() => props.onGenerate("hashtags")} busy={loading === "hashtags"}/>
          <div className="hashtag-list">{result.hashtags.map((tag, index) => <button type="button" key={`${tag}-${index}`} onClick={() => props.onCopy(`tag-${index}`, tag)} className="hashtag">{tag}</button>)}</div>
        </> : <><StaticCardTitle eyebrow="05 · HASHTAG" title="해시태그"/><EmptyCard text="복사 가능한 해시태그 8개가 표시됩니다." loading={isInitialLoading}/></>}
      </article>
    </div>

    {result && <p className="result-meta">{props.providerName} · {new Date(result.generatedAt).toLocaleString("ko-KR")}</p>}
  </section>;
}
