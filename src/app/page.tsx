import MusicGenerator from "@/components/music-generator";
import { artists } from "../../data/artists";

export default function Home() {
  return <MusicGenerator artists={artists} />;
}
