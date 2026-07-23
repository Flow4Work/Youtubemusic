import { z } from "zod";

export const songSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
});

export const songSchema = z.object({
  id: z.string().min(1),
  artistId: z.string().min(1).optional(),
  artistName: z.string().min(1).optional(),
  title: z.string().min(1),
  key: z.string().min(1).nullable(),
  bpm: z.number().int().min(30).max(240).nullable(),
  timeSignature: z.string().min(1).nullable(),
  sections: z.record(z.string(), z.array(z.string())),
  sources: z.array(songSourceSchema).optional(),
  verificationNote: z.string().optional(),
  sourceName: z.string().min(1).optional(),
  sourceUrl: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  verified: z.boolean(),
  demo: z.boolean().optional(),
});

export const artistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  demo: z.boolean().optional(),
  songs: z.array(songSchema).min(1),
});

export const chordResultSchema = z.object({
  key: z.string().min(1),
  bpm: z.number().int().min(30).max(240),
  timeSignature: z.string().min(1),
  sections: z.record(z.string(), z.array(z.string())),
});

export const generationResultSchema = z.object({
  chords: chordResultSchema,
  sunoStyle: z.string().min(20),
  sunoStyleKorean: z.string().min(20),
  lyrics: z.object({
    a: z.string().min(80),
    b: z.string().min(60),
  }),
  titles: z.array(z.string().min(1)).length(3),
  titlesEnglish: z.array(z.string().min(1)).length(3),
  hashtags: z.array(z.string().min(1)).length(8),
});

export const generateRequestSchema = z.object({
  artist: artistSchema,
  song: songSchema,
  target: z.enum(["all", "chords", "style", "lyrics", "titles", "hashtags"]),
  existing: generationResultSchema.optional(),
});
