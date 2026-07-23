import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { artistSchema } from "@/lib/schemas";
import type { Artist } from "@/lib/types";

const ARTISTS_DIRECTORY = path.join(process.cwd(), "data", "artists");
const REAL_ARTISTS_DIRECTORY = path.join(ARTISTS_DIRECTORY, "real");

async function readArtists(directory: string): Promise<Artist[]> {
  let fileNames: string[];

  try {
    fileNames = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  return Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(directory, fileName);

      try {
        const raw = JSON.parse(await readFile(filePath, "utf8")) as unknown;
        return artistSchema.parse(raw);
      } catch (error) {
        throw new Error(`가수 JSON 로딩 실패: ${path.relative(process.cwd(), filePath)}`, {
          cause: error,
        });
      }
    }),
  );
}

export async function loadArtists(): Promise<Artist[]> {
  const realArtists = await readArtists(REAL_ARTISTS_DIRECTORY);
  if (realArtists.length > 0) return realArtists;

  return readArtists(ARTISTS_DIRECTORY);
}
