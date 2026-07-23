import type { ChordResult } from "@/lib/types";

const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_INDEX: Record<string, number> = {
  C: 0, "B#": 0,
  "C#": 1, Db: 1,
  D: 2,
  "D#": 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, "E#": 5,
  "F#": 6, Gb: 6,
  G: 7,
  "G#": 8, Ab: 8,
  A: 9,
  "A#": 10, Bb: 10,
  B: 11, Cb: 11,
};

function transposeToken(chord: string, semitones: number): string {
  return chord.replace(/^([A-G](?:#|b)?)(.*)$/u, (_, root: string, suffix: string) => {
    const index = NOTE_INDEX[root];
    if (index === undefined) return chord;
    const next = (index + semitones + 120) % 12;
    return `${NOTES_SHARP[next]}${suffix}`;
  });
}

function mapChordLine(line: string, transform: (chord: string) => string): string {
  return line
    .split(/(\s+(?:-|→|\|)\s+)/u)
    .map((part) => (/^\s+(?:-|→|\|)\s+$/u.test(part) ? part : transform(part.trim())))
    .join("");
}

export function transposeChordResult(result: ChordResult, semitones: number): ChordResult {
  return {
    ...result,
    key: transposeToken(result.key, semitones),
    sections: Object.fromEntries(
      Object.entries(result.sections).map(([section, chords]) => [
        section,
        chords.map((line) => mapChordLine(line, (chord) => transposeToken(chord, semitones))),
      ]),
    ),
  };
}

export function simplifyChord(chord: string): string {
  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/u);
  if (!match) return chord;
  const [, root, suffix] = match;
  const isMinor = /^m(?!aj)/u.test(suffix);
  return `${root}${isMinor ? "m" : ""}`;
}

export function simplifyChordResult(result: ChordResult): ChordResult {
  return {
    ...result,
    sections: Object.fromEntries(
      Object.entries(result.sections).map(([section, chords]) => [
        section,
        chords.map((line) => mapChordLine(line, simplifyChord)),
      ]),
    ),
  };
}

export const sectionLabel: Record<string, string> = {
  intro: "인트로",
  verse: "벌스",
  preChorus: "프리코러스",
  chorus: "코러스",
  bridge: "브리지",
  finalChorus: "파이널 코러스",
  outro: "아웃트로",
};
