import { z } from "zod";

export const songSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  key: z.string().min(1),
  bpm: z.number().int().min(30).max(240),
  timeSignature: z.string().min(1),
  sections: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  sourceName: z.string().min(1),
  sourceUrl: z.string().min(1),
  license: z.string().min(1),
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
  sections: z.record(z.string(), z.array(z.string().min(1)).min(1)),
});

export const generationResultSchema = z.object({
  chords: chordResultSchema,
  sunoStyle: z.string().min(20),
  lyrics: z.object({
    a: z.string().min(40),
    b: z.string().min(40),
  }),
  titles: z.array(z.string().min(1)).length(3),
  hashtags: z.array(z.string().min(1)).length(8),
});

export const generateRequestSchema = z.object({
  artist: artistSchema,
  song: songSchema,
  target: z.enum(["all", "chords", "style", "lyrics", "titles", "hashtags"]),
  existing: generationResultSchema.optional(),
});
