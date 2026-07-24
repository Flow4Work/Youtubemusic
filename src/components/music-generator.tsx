"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HistoryIcon, MusicIcon } from "@/components/icons";
import { GeneratorResults } from "@/components/generator-results";
import { GeneratorSelection } from "@/components/generator-selection";
import { HistoryDrawer } from "@/components/history-drawer";
import { MemorySongSelection } from "@/components/memory-song-selection";
import memoryStyles from "@/components/memory-song.module.css";
import { simplifyChordResult, transposeChordResult } from "@/lib/chords";
import { getMemoryTopic } from "@/lib/memory-song";
import { clearHistory, loadHistory, prependHistory, removeHistory } from "@/lib/storage";
import type {
  Artist,
  GeneratedPayload,
  GenerateResponse,
  GenerationResult,
  GenerationTarget,
  GeneratorMode,
  MemorySongStyle,
} from "@/lib/types";

const targetLabel: Record<GenerationTarget, string> = { all: "전체 결과", chords: "코드", style: "Suno 스타일", lyrics: "가사", titles: "제목", hashtags: "해시태그" };
const refreshToastLabel: Record<Exclude<GenerationTarget, "all">, string> = {
  chords: "코드를 새로 만들고 있습니다.",
  style: "Suno 스타일을 새로 만들고 있습니다.",
  lyrics: "가사를 새로 만들고 있습니다.",
  titles: "제목을 새로 만들고 있습니다.",
  hashtags: "해시태그를 새로 만들고 있습니다.",
};

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

function existingResult(result: GeneratedPayload | null): GenerationResult | undefined {
  if (!result) return undefined;
  return {
    chords: result.chords,
    sunoStyle: result.sunoStyle,
    sunoStyleKorean: result.sunoStyleKorean,
    lyrics: result.lyrics,
    titles: result.titles,
    titlesEnglish: result.titlesEnglish,
    hashtags: result.hashtags,
  };
}

export default function MusicGenerator({ artists }: { artists: Artist[] }) {
  const [mode, setMode] = useState<GeneratorMode>("regular");
  const [artistId, setArtistId] = useState("");
  const [songId, setSongId] = useState("");
  const [query, setQuery] = useState("");
  const [regularResult, setRegularResult] = useState<GeneratedPayload | null>(null);
  const [memoryResult, setMemoryResult] = useState<GeneratedPayload | null>(null);
  const [memoryTopicId, setMemoryTopicId] = useState("");
  const [memoryStyle, setMemoryStyle] = useState<MemorySongStyle | "">("");
  const [history, setHistory] = useState<GeneratedPayload[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState<GenerationTarget | null>(null);
  const [durationEstimate, setDurationEstimate] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [copied, setCopied] = useState("");
  const [refreshToast, setRefreshToast] = useState("");
  const [lyricsTab, setLyricsTab] = useState<"a" | "b">("a");
  const [simplified, setSimplified] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestLockRef = useRef(false);
  const copyTimerRef = useRef<number | null>(null);
  const refreshToastTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHistory(loadHistory()));
    return () => {
      window.cancelAnimationFrame(frame);
      abortRef.current?.abort();
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (refreshToastTimerRef.current) window.clearTimeout(refreshToastTimerRef.current);
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setHistoryOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [historyOpen]);

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
  const selectedMemoryTopic = useMemo(() => getMemoryTopic(memoryTopicId), [memoryTopicId]);
  const result = mode === "regular" ? regularResult : memoryResult;
  const displayChords = useMemo(() => !result ? null : simplified ? simplifyChordResult(result.chords) : result.chords, [result, simplified]);
  const regenerationBlocked = Boolean(loading) || cooldownSeconds > 0;
  const canGenerate = mode === "regular"
    ? Boolean(selectedArtist && selectedSong && !regenerationBlocked)
    : Boolean(selectedMemoryTopic && memoryStyle && !regenerationBlocked);
  const providerName = result?.provider === "groq" ? "Groq" : "Mock";

  function changeMode(nextMode: GeneratorMode) {
    if (loading) return;
    setMode(nextMode);
    setMessage(null);
    setSimplified(false);
    setLyricsTab("a");
  }

  function chooseArtist(id: string) {
    setArtistId(id);
    setSongId("");
    setRegularResult(null);
    setMessage(null);
  }

  function chooseSong(id: string) {
    setSongId(id);
    setRegularResult(null);
    setMessage(null);
  }

  function chooseMemoryTopic(id: string) {
    const topic = getMemoryTopic(id);
    setMemoryTopicId(id);
    setMemoryStyle(topic?.recommendedStyles[0] ?? "");
    setMemoryResult(null);
    setMessage(null);
  }

  function startCountdown(estimate: number) {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    const startedAt = Date.now();
    setRemainingSeconds(estimate);
    countdownTimerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(Math.max(0, estimate - elapsed));
    }, 1000);
  }

  function stopCountdown() {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setRemainingSeconds(null);
  }

  function startCooldown(seconds: number) {
    if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
    let remaining = Math.max(1, Math.ceil(seconds));
    setCooldownSeconds(remaining);
    setMessage({ text: `요청 한도를 초과했습니다. ${remaining}초 후 다시 시도해 주세요.`, error: true });

    cooldownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setCooldownSeconds(Math.max(0, remaining));
      if (remaining <= 0) {
        if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
        setMessage(null);
      }
    }, 1000);
  }

  function showRefreshToast(target: Exclude<GenerationTarget, "all">) {
    setRefreshToast(refreshToastLabel[target]);
    if (refreshToastTimerRef.current) window.clearTimeout(refreshToastTimerRef.current);
    refreshToastTimerRef.current = window.setTimeout(() => {
      setRefreshToast("");
      refreshToastTimerRef.current = null;
    }, 2500);
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
    const requestMode = mode;
    const currentResult = requestMode === "regular" ? regularResult : memoryResult;
    const topic = requestMode === "memory" ? selectedMemoryTopic : null;
    if (requestLockRef.current || cooldownSeconds > 0) return;
    if (requestMode === "regular" && (!selectedArtist || !selectedSong)) return;
    if (requestMode === "memory" && (!topic || !memoryStyle)) return;

    requestLockRef.current = true;
    if (target !== "all") showRefreshToast(target);
    const startedAt = Date.now();
    const estimate = target === "all"
      ? requestMode === "memory" ? Math.max(38, durationEstimate) : durationEstimate
      : target === "lyrics"
        ? Math.max(16, Math.round(durationEstimate * 0.55))
        : Math.max(8, Math.round(durationEstimate * 0.35));
    startCountdown(estimate);
    setLoading(target);
    setMessage(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const endpoint = requestMode === "memory" ? "/api/generate-memory" : "/api/generate";
      const body = requestMode === "memory"
        ? { mode: "memory", topicId: topic?.id, style: memoryStyle, target, existing: existingResult(currentResult) }
        : { artist: selectedArtist, song: selectedSong, target, existing: existingResult(currentResult) };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json() as GenerateResponse & { error?: string };

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After")) || 10;
        startCooldown(retryAfter);
        return;
      }
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error("API 인증 정보를 확인해 주세요.");
        throw new Error(data.error || "생성 요청에 실패했습니다.");
      }

      const merged = currentResult ? mergeTarget(currentResult, data.result, target) : data.result;
      const payload: GeneratedPayload = requestMode === "memory" && topic
        ? {
          ...merged,
          id: target === "all" || !currentResult ? makeId() : currentResult.id,
          artistId: "memory-song",
          artistName: "암기송",
          songId: topic.id,
          songTitle: topic.title,
          provider: data.provider,
          generatedAt: new Date().toISOString(),
          warning: data.warning,
          mode: "memory",
          memoryTopicId: topic.id,
          memoryStyle: memoryStyle as MemorySongStyle,
        }
        : {
          ...merged,
          id: target === "all" || !currentResult ? makeId() : currentResult.id,
          artistId: selectedArtist?.id ?? "",
          artistName: selectedArtist?.name ?? "",
          songId: selectedSong?.id ?? "",
          songTitle: selectedSong?.title ?? "",
          provider: data.provider,
          generatedAt: new Date().toISOString(),
          warning: data.warning,
          mode: "regular",
        };

      if (requestMode === "memory") setMemoryResult(payload);
      else setRegularResult(payload);
      setSimplified(false);
      setHistory((current) => prependHistory(payload, current));
      if (target === "all") {
        const elapsed = Math.max(1, Math.ceil((Date.now() - startedAt) / 1000));
        setDurationEstimate(Math.min(75, Math.max(15, Math.round(elapsed * 1.15))));
      }
      setMessage({ text: data.warning || `${targetLabel[target]} 생성이 완료되었습니다.`, error: false });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage({ text: error instanceof Error ? error.message : "네트워크 오류가 발생했습니다.", error: true });
    } finally {
      stopCountdown();
      setLoading(null);
      requestLockRef.current = false;
      abortRef.current = null;
    }
  }

  function transpose(value: number) {
    if (!result) return;
    const next = { ...result, chords: transposeChordResult(result.chords, value), generatedAt: new Date().toISOString() };
    if (mode === "memory") setMemoryResult(next);
    else setRegularResult(next);
    setHistory((current) => prependHistory(next, current));
  }

  function loadSaved(item: GeneratedPayload) {
    const isMemory = item.mode === "memory" || item.artistId === "memory-song";
    if (isMemory) {
      const topicId = item.memoryTopicId || item.songId;
      const topic = getMemoryTopic(topicId);
      setMode("memory");
      setMemoryTopicId(topicId);
      setMemoryStyle(item.memoryStyle || topic?.recommendedStyles[0] || "");
      setMemoryResult(item);
    } else {
      setMode("regular");
      setArtistId(item.artistId);
      setSongId(item.songId);
      setRegularResult(item);
    }
    setSimplified(false);
    setLyricsTab("a");
    setHistoryOpen(false);
    setMessage({ text: "이전 결과를 불러왔습니다.", error: false });
  }

  return <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className={memoryStyles.appBrand}><span className="grid size-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,.25)]"><MusicIcon className="size-5"/></span><div className={memoryStyles.appBrandCopy}><p className="text-[15px] font-extrabold tracking-[-0.03em] text-slate-950">YouTube Music Maker</p><div className={memoryStyles.modeTabs} role="tablist" aria-label="음악 생성 유형">
        <button type="button" role="tab" aria-selected={mode === "regular"} disabled={Boolean(loading)} onClick={() => changeMode("regular")} className={mode === "regular" ? memoryStyles.active : ""}>일반 음악</button>
        <button type="button" role="tab" aria-selected={mode === "memory"} disabled={Boolean(loading)} onClick={() => changeMode("memory")} className={mode === "memory" ? memoryStyles.active : ""}>암기송</button>
      </div></div></div>
      <button type="button" onClick={() => setHistoryOpen(true)} className="secondary-button"><HistoryIcon className="size-4"/><span className="hidden sm:inline">최근 결과</span>{history.length > 0 && <span className="count-badge">{history.length}</span>}</button>
    </div></header>

    <div className="studio-page">
      <div className="studio-layout">
        {mode === "regular" ? <GeneratorSelection artists={filteredArtists} artistId={artistId} songId={songId} query={query} selectedArtist={selectedArtist} selectedSong={selectedSong} canGenerate={canGenerate} loadingTarget={loading} remainingSeconds={remainingSeconds} cooldownSeconds={cooldownSeconds} onQuery={setQuery} onArtist={chooseArtist} onSong={chooseSong} onGenerate={() => generate("all")}/> : <MemorySongSelection topicId={memoryTopicId} style={memoryStyle} canGenerate={canGenerate} loadingTarget={loading} remainingSeconds={remainingSeconds} cooldownSeconds={cooldownSeconds} onTopic={chooseMemoryTopic} onStyle={setMemoryStyle} onGenerate={() => generate("all")}/>} 
        <GeneratorResults result={result} chords={displayChords} loading={loading} regenerationBlocked={regenerationBlocked} cooldownSeconds={cooldownSeconds} simplified={simplified} lyricsTab={lyricsTab} copied={copied} providerName={providerName} onGenerate={generate} onCopy={showCopied} onTranspose={transpose} onSimplified={() => setSimplified((value) => !value)} onLyricsTab={setLyricsTab}/>
      </div>
      {message && <div className={`status-message ${message.error ? "error" : "success"}`} role="status">{message.text}</div>}
    </div>

    {(refreshToast || copied) && <div className="global-copy-toast" role="status">{refreshToast || "클립보드에 복사되었습니다."}</div>}
    <HistoryDrawer open={historyOpen} history={history} onClose={() => setHistoryOpen(false)} onLoad={loadSaved} onRemove={(id: string) => setHistory((current) => removeHistory(id, current))} onClear={() => setHistory(clearHistory())}/>
  </main>;
}
