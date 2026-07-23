import yoonseul from "./yoonseul.json";
import saebom from "./saebom.json";
import haeon from "./haeon.json";
import daon from "./daon.json";
import narin from "./narin.json";
import seodam from "./seodam.json";
import haram from "./haram.json";
import soyul from "./soyul.json";
import eden from "./eden.json";
import arin from "./arin.json";
import roa from "./roa.json";
import yudam from "./yudam.json";
import gaon from "./gaon.json";
import sion from "./sion.json";
import rahee from "./rahee.json";
import yedam from "./yedam.json";
import doyun from "./doyun.json";
import seowoo from "./seowoo.json";
import hajin from "./hajin.json";
import chaeon from "./chaeon.json";

import { artistSchema } from "@/lib/schemas";
import type { Artist } from "@/lib/types";

const rawArtists = [yoonseul, saebom, haeon, daon, narin, seodam, haram, soyul, eden, arin, roa, yudam, gaon, sion, rahee, yedam, doyun, seowoo, hajin, chaeon];

export const artists: Artist[] = rawArtists.map((artist) => artistSchema.parse(artist));
