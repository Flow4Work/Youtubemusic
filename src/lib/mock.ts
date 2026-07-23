import type { GenerationResult, Song } from "@/lib/types";

const lyricA = `[Verse 1]\n창가에 번진 늦은 햇살\n오늘도 마음을 천천히 열어\n서툰 하루를 접어 둔 채\n한 걸음 먼저 너에게 갈게\n\n[Pre-Chorus]\n조금 느려도 괜찮아\n우리의 박자는 여기 있으니\n\n[Chorus]\n다시 시작되는 오늘\n작은 목소리도 노래가 되고\n흔들린 시간 끝에서\n나는 너와 같은 꿈을 부를게\n\n[Verse 2]\n익숙한 골목 끝의 바람\n잊었던 웃음을 다시 데려와\n멀리 돌아온 마음까지\n이제는 따뜻하게 안아 줄게`;

const lyricB = `[Verse 1]\n불 꺼진 거리 위로 내려온\n푸른 새벽이 어깨를 감싸면\n말하지 못한 많은 장면이\n조용히 별처럼 떠오르네\n\n[Pre-Chorus]\n끝이라고 믿었던 순간\n새로운 문이 열리고 있어\n\n[Chorus]\n너의 계절을 따라 걸어\n서로 다른 내일도 함께 그려\n눈물이 지나간 자리엔\n더 환한 우리 노래가 남을 거야\n\n[Bridge]\n아주 작은 용기 하나면\n긴 밤도 결국 아침이 되니까`;

export function createMockResult(song: Song): GenerationResult {
  const baseSections = Object.fromEntries(
    Object.entries(song.sections).map(([name, chords]) => [name, [...chords]]),
  );

  return {
    chords: {
      key: song.key,
      bpm: Math.min(180, Math.max(55, song.bpm + 4)),
      timeSignature: song.timeSignature,
      sections: {
        ...baseSections,
        bridge: baseSections.bridge ?? ["Am7", "Em7", "Fmaj7", "G"],
      },
    },
    sunoStyle:
      "따뜻한 한국어 팝 발라드, 선명한 어쿠스틱 기타와 부드러운 피아노, 중저음 남녀 공용 보컬, 92 BPM 안팎, 후렴에서 드럼과 스트링이 자연스럽게 확장, 따라 부르기 쉬운 멜로디, 과도한 고음과 랩 없이 진솔하고 희망적인 분위기, 원곡의 멜로디나 가사를 복제하지 않는 완전한 신곡",
    lyrics: { a: lyricA, b: lyricB },
    titles: ["다시 시작되는 오늘", "너의 계절을 따라", "별이 된 마음"],
    hashtags: ["#신곡", "#감성발라드", "#한국어노래", "#SunoAI", "#작곡", "#힐링음악", "#노래만들기", "#유튜브뮤직"],
  };
}
