"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HistoryIcon, MusicIcon } from "@/components/icons";
import { GeneratorResults } from "@/components/generator-results";
import { GeneratorSelection } from "@/components/generator-selection";
import { HistoryDrawer } from "@/components/history-drawer";
import { simplifyChordResult, transposeChordResult } from "@/lib/chords";
import { clearHistory, loadHistory, prependHistory, removeHistory } from "@/lib/storage";
import type { Artist, GeneratedPayload, GenerateResponse, GenerationResult, GenerationTarget } from "@/lib/types";

const targetLabel: Record<GenerationTarget, string> = { all: "전체 결과", chords: "코드", style: "Suno 스타일", lyrics: "가사", titles: "제목", hashtags: "해시태그" };

function mergeTarget(current: GenerationResult, incoming: GenerationResult, target: GenerationTarget): GenerationResult {
  if (target === "all") return incoming;
  if (target === "chords") return { ...current, chords: incoming.chords };
  if (target === "style") return { ...current, sunoStyle: incoming.sunoStyle, sunoStyleKorean: incoming.sunoStyleKorean };
  if (target === "lyrics") return { ...current, lyrics: incoming.lyrics };
  if (target === "titles") return { ...current, titles: incoming.titles, titlesEnglish: incoming.titlesEnglish };
  return { ...current, hashtags: incoming.hashtags };
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export default function MusicGenerator({ artists }: { artists: Artist[] }) {
  const [artistId, setArtistId] = useState("");
  const [songId, setSongId] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<GeneratedPayload | null>(null);
  const [history, setHistory] = useState<GeneratedPayload[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState<GenerationTarget | null>(null);
  const [durationEstimate, setDurationEstimate] = useState(30);
  const [activeEstimate, setActiveEstimate] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [copied, setCopied] = useState("");
  const [lyricsTab, setLyricsTab] = useState<"a" | "b">("a");
  const [simplified, setSimplified] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHistory(loadHistory()));
    return () => {
      window.cancelAnimationFrame(frame);
      abortRef.current?.abort();
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setHistoryOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [historyOpen]);

  useEffect(() => {
    if (!loading) {
      setRemainingSeconds(null);
      return;
    }
    const startedAt = Date.now();
    setRemainingSeconds(activeEstimate);
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(Math.max(0, activeEstimate - elapsed));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading, activeEstimate]);

  useEffect(() => {
    if (!message || message.error) return;
    const timer = window.setTimeout(() => setMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const filteredArtists = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? artists.filter((artist) => artist.name.toLowerCase().includes(value)) : artists;
  }, [artists, query]);
  const selectedArtist = useMemo(() => artists.find((artist) => artist.id === artistId) ?? null, [artists, artistId]);
  const selectedSong = useMemo(() => selectedArtist?.songs.find((song) => song.id === songId) ?? null, [selectedArtist, songId]);
  const displayChords = useMemo(() => !result ? null : simplified ? simplifyChordResult(result.chords) : result.chords, [result, simplified]);
  const canGenerate = Boolean(selectedArtist && selectedSong && !loading);
  const providerName = result?.provider === "groq" ? "Groq" : "Mock";

  function chooseArtist(id: string) {
    setArtistId(id);
    setSongId("");
    setResult(null);
    setMessage(null);
  }

  function chooseSong(id: string) {
    setSongId(id);
    setResult(null);
    setMessage(null);
  }

  async function showCopied(key: string, text: string) {
    if (!text.trim()) return;
    try {
      await copyText(text);
      setCopied(key);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopied("");
        copyTimerRef.current = null;
      }, 1400);
    } catch {
      setMessage({ text: "복사에 실패했습니다. 브라우저 권한을 확인해 주세요.", error: true });
    }
  }

  async function generate(target: GenerationTarget) {
    if (!selectedArtist || !selectedSong || loading) return;
    const startedAt = Date.now();
    const estimate = target === "all" ? durationEstimate : Math.max(10, Math.round(durationEstimate * 0.55));
    setActiveEstimate(estimate);
    setLoading(target);
    setMessage(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const existing = result ? {
        chords: result.chords,
        sunoStyle: result.sunoStyle,
        sunoStyleKorean: result.sunoStyleKorean,
        lyrics: result.lyrics,
        titles: result.titles,
        titlesEnglish: result.titlesEnglish,
        hashtags: result.hashtags,
      } : undefined;
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist: selectedArtist, song: selectedSong, target, existing }),
        signal: controller.signal,
      });
      const data = await response.json() as GenerateResponse & { error?: string };
      if (!response.ok) {
        if (response.status === 429) throw new Error("요청이 많습니다. 잠시 뒤 다시 시도해 주세요.");
        if (response.status === 401 || response.status === 403) throw new Error("API 인증 정보를 확인해 주세요.");
        throw new Error(data.error || "생성 요청에 실패했습니다.");
      }
      const merged = result ? mergeTarget(result, data.result, target) : data.result;
      const payload: GeneratedPayload = {
        ...merged,
        id: target === "all" || !result ? makeId() : result.id,
        artistId: selectedArtist.id,
        artistName: selectedArtist.name,
        songId: selectedSong.id,
        songTitle: selectedSong.title,
        provider: data.provider,
        generatedAt: new Date().toISOString(),
        warning: data.warning,
      };
      setResult(payload);
      setSimplified(false);
      setHistory((current) => prependHistory(payload, current));
      if (target === "all") {
        const elapsed = Math.max(1, Math.ceil((Date.now() - startedAt) / 1000));
        setDurationEstimate(Math.min(60, Math.max(15, Math.round(elapsed * 1.15))));
      }
      setMessage({ text: data.warning || `${targetLabel[target]} 생성이 완료되었습니다.`, error: false });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage({ text: error instanceof Error ? error.message : "네트워크 오류가 발생했습니다.", error: true });
    } finally {
      setLoading(null);
      abortRef.current = null;
    }
  }

  function transpose(value: number) {
    if (!result) return;
    const next = { ...result, chords: transposeChordResult(result.chords, value), generatedAt: new Date().toISOString() };
    setResult(next);
    setHistory((current) => prependHistory(next, current));
  }

  function loadSaved(item: GeneratedPayload) {
    setArtistId(item.artistId);
    setSongId(item.songId);
    setResult(item);
    setHistoryOpen(false);
    setMessage({ text: "이전 결과를 불러왔습니다.", error: false });
  }

  return <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,.25)]"><MusicIcon className="size-5"/></span><div><p className="text-[15px] font-extrabold tracking-[-0.03em] text-slate-950">YouTube Music Maker</p><p className="text-xs text-slate-500">선택부터 결과 복사까지 한 화면에서</p></div></div>
      <button type="button" onClick={() => setHistoryOpen(true)} className="secondary-button"><HistoryIcon className="size-4"/><span className="hidden sm:inline">최근 결과</span>{history.length > 0 && <span className="count-badge">{history.length}</span>}</button>
    </div></header>

    <div className="studio-page">
      <div className="studio-layout">
        <GeneratorSelection artists={filteredArtists} artistId={artistId} songId={songId} query={query} selectedArtist={selectedArtist} selectedSong={selectedSong} canGenerate={canGenerate} loadingTarget={loading} remainingSeconds={remainingSeconds} onQuery={setQuery} onArtist={chooseArtist} onSong={chooseSong} onGenerate={() => generate("all")}/>
        <GeneratorResults result={result} chords={displayChords} loading={loading} simplified={simplified} lyricsTab={lyricsTab} copied={copied} providerName={providerName} onGenerate={generate} onCopy={showCopied} onTranspose={transpose} onSimplified={() => setSimplified((value) => !value)} onLyricsTab={setLyricsTab}/>
      </div>
      {message && <div className={`status-message ${message.error ? "error" : "success"}`} role="status">{message.text}</div>}
    </div>

    {copied && <div className="global-copy-toast" role="status">클립보드에 복사되었습니다.</div>}
    <HistoryDrawer open={historyOpen} history={history} onClose={() => setHistoryOpen(false)} onLoad={loadSaved} onRemove={(id) => setHistory((current) => removeHistory(id, current))} onClear={() => setHistory(clearHistory())}/>
  </main>;
}
