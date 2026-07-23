import MusicGenerator from "@/components/music-generator";
import { loadArtists } from "../../data/artists";

export default async function Home() {
  const artists = await loadArtists();
  return <MusicGenerator artists={artists} />;
}
