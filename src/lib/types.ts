export type SongSections = Record<string, string[]>;

export interface SongSource {
  name: string;
  url: string;
}

export interface Song {
  id: string;
  artistId?: string;
  artistName?: string;
  title: string;
  key: string | null;
  bpm: number | null;
  timeSignature: string | null;
  sections: SongSections;
  sources?: SongSource[];
  verificationNote?: string;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  verified: boolean;
  demo?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  description?: string;
  demo?: boolean;
  songs: Song[];
}

export interface ChordResult {
  key: string;
  bpm: number;
  timeSignature: string;
  sections: SongSections;
}

export interface GenerationResult {
  chords: ChordResult;
  sunoStyle: string;
  lyrics: {
    a: string;
    b: string;
  };
  titles: string[];
  hashtags: string[];
}

export type GenerationTarget =
  | "all"
  | "chords"
  | "style"
  | "lyrics"
  | "titles"
  | "hashtags";

export interface GeneratedPayload extends GenerationResult {
  id: string;
  artistId: string;
  artistName: string;
  songId: string;
  songTitle: string;
  provider: "groq" | "mock";
  generatedAt: string;
  warning?: string;
}

export interface GenerateRequest {
  artist: Artist;
  song: Song;
  target: GenerationTarget;
  existing?: GenerationResult;
}

export interface GenerateResponse {
  result: GenerationResult;
  provider: "groq" | "mock";
  warning?: string;
}
