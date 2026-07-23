import type { z } from "zod";
import type { GenerateRequest } from "@/lib/types";
import type { lyricBlueprintSchema, lyricPublicationPackageSchema, lyricsResultSchema } from "@/lib/schemas";

type LyricBlueprint = z.infer<typeof lyricBlueprintSchema>;
type LyricsResult = z.infer<typeof lyricsResultSchema>;
type LyricPublicationPackage = z.infer<typeof lyricPublicationPackageSchema>;

type LyricOutput = LyricsResult | LyricPublicationPackage;

function rawSongContext(input: GenerateRequest): string {
  return `아티스트: ${input.artist.name}
참고곡: ${input.song.title}
검증된 Key: ${input.song.key ?? "미확인"}
검증된 BPM: ${input.song.bpm ?? "미확인"}
검증된 박자: ${input.song.timeSignature ?? "미확인"}
검증된 구간별 코드: ${JSON.stringify(input.song.sections)}`;
}

function existingMusicContext(input: GenerateRequest): string {
  if (!input.existing) return "기존 결과 없음";
  return `현재 코드: ${JSON.stringify(input.existing.chords)}
현재 Suno 스타일: ${input.existing.sunoStyle}
현재 Suno 스타일 한국어 설명: ${input.existing.sunoStyleKorean}`;
}

const originalityRules = `참고곡의 멜로디, 가사, 제목, 고유 훅, 긴 코드 배열을 복제하거나 조금 바꾸어 재사용하지 마세요.
참고 가능한 것은 조성 감각, 체감 속도, 화성 밀도, 긴장과 해소의 위치, 전조 방식, 구간별 에너지 곡선 같은 추상적인 특징뿐입니다.
결과물에 아티스트 이름과 참고곡 제목을 넣지 마세요.`;

const blueprintRules = `lyricBlueprint는 작사가에게 전달하는 비음악적 이야기 설계서입니다.
lyricBlueprint 안에는 코드명, 음이름, Key, BPM 숫자, 박자표, 악기명, 템포, 전조, 화음, 도미넌트 같은 제작 용어를 절대 쓰지 마세요.
대신 느림과 빠름, 억눌림과 확장, 망설임과 결심처럼 사람이 이해할 수 있는 감정과 움직임으로 번역하세요.
장면은 시간, 장소, 행동, 사물 중 최소 3개가 보이게 구체화하세요.
감정은 시작, 흔들림, 선택, 결론이 서로 모순되지 않게 연결하세요.
concreteWordPalette에는 실제 가사에서 사용할 수 있는 구체적인 한국어 명사와 동사를 넣으세요.
avoidList에는 상투어, 제작 용어, 참고곡 고유 표현을 포함해 최소 8개를 넣으세요.`;

export function buildSongPlanPrompt(input: GenerateRequest): string {
  return `당신은 한국 대중음악의 신곡을 설계하는 프로듀서이자 스토리 에디터입니다.

${originalityRules}

참고 자료:
${rawSongContext(input)}

작업 순서:
1. 참고곡의 매력 요소를 내부적으로 분석합니다.
2. 약 2분짜리 독립적인 신곡의 코드와 Suno 편곡 방향을 설계합니다.
3. 같은 분석을 코드명과 제작 용어가 없는 lyricBlueprint로 번역합니다.

코드 규칙:
- verse와 chorus는 반드시 포함하고 최소 3개 구간을 사용하세요.
- 짧은 인트로, Verse와 Chorus의 확실한 대비, Final Chorus의 변화가 있어야 합니다.
- 참고곡의 긴 코드 배열은 복제하지 말고 새로운 진행을 만드세요.

Suno 스타일 규칙:
- 영어 70~110단어 한 문단으로 작성하세요.
- 체감 템포, 핵심 악기, 드럼과 베이스 움직임, 보컬 강약, Chorus 상승, Bridge 또는 Final Chorus 변화, 공간감, 믹스와 엔딩을 구체적으로 작성하세요.
- 아티스트 이름, 참고곡 제목, in the style of 표현은 넣지 마세요.

${blueprintRules}

부가 설명이나 Markdown 없이 다음 JSON만 반환하세요.
{
  "chords": {
    "key": "C",
    "bpm": 90,
    "timeSignature": "4/4",
    "sections": {
      "intro": ["C", "G"],
      "verse": ["C", "Em", "Am", "F"],
      "preChorus": ["Dm", "Em", "F", "G"],
      "chorus": ["F", "G", "Em", "Am"],
      "bridge": ["Am", "Em", "F", "G"],
      "finalChorus": ["F", "G", "Am", "C/E"],
      "outro": ["C", "F", "C"]
    }
  },
  "sunoStyle": "English production prompt",
  "sunoStyleKorean": "영어 편곡 지시의 정확한 한국어 설명",
  "lyricBlueprint": {
    "storyPremise": "한 문단의 이야기 전제",
    "openingScene": "첫 장면",
    "speakerGoal": "화자가 원하는 것",
    "emotionalArc": ["시작", "흔들림", "선택", "결론"],
    "chorusHookIntent": "후렴 핵심 문장이 전달할 의미",
    "finalResolution": "마지막 결론",
    "tempoFeel": "숫자와 제작 용어가 없는 체감 움직임",
    "harmonicMotion": "코드명 없이 설명한 감정의 긴장과 해소",
    "vocalEnergy": "보컬의 감정 강약",
    "concreteWordPalette": ["구체어1", "구체어2", "구체어3", "구체어4", "구체어5", "구체어6"],
    "avoidList": ["금지어1", "금지어2", "금지어3", "금지어4", "금지어5", "금지어6", "금지어7", "금지어8"]
  }
}`;
}

export function buildLyricBlueprintPrompt(input: GenerateRequest): string {
  return `당신은 한국 대중가요 가사를 위한 이야기 설계자입니다.

${originalityRules}

참고 자료:
${rawSongContext(input)}

현재 신곡의 음악 정보:
${existingMusicContext(input)}

${blueprintRules}

가사를 쓰지 말고, 원본 음악 정보를 작사가가 안전하게 사용할 수 있는 비음악적 이야기 설계서로만 번역하세요.
부가 설명이나 Markdown 없이 다음 JSON만 반환하세요.
{
  "storyPremise": "한 문단의 이야기 전제",
  "openingScene": "첫 장면",
  "speakerGoal": "화자가 원하는 것",
  "emotionalArc": ["시작", "흔들림", "선택", "결론"],
  "chorusHookIntent": "후렴 핵심 문장이 전달할 의미",
  "finalResolution": "마지막 결론",
  "tempoFeel": "숫자와 제작 용어가 없는 체감 움직임",
  "harmonicMotion": "코드명 없이 설명한 감정의 긴장과 해소",
  "vocalEnergy": "보컬의 감정 강약",
  "concreteWordPalette": ["구체어1", "구체어2", "구체어3", "구체어4", "구체어5", "구체어6"],
  "avoidList": ["금지어1", "금지어2", "금지어3", "금지어4", "금지어5", "금지어6", "금지어7", "금지어8"]
}`;
}

function lyricCoreRules(): string {
  return `한국어로 실제 노래 가사만 작성하세요.
허용되는 구간명은 [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus], [Outro]뿐입니다.
구간명 외의 설명, 제작 지시, 괄호 해설은 넣지 마세요.
코드명, 음이름, Key, BPM, 박자, 템포, 전조, 화음, 멜로디, 피아노, 기타, 드럼, 베이스, 스트링, 신스, 믹스, 음역, 마디 같은 제작 용어를 가사에 절대 넣지 마세요.
별빛, 바람, 그림자, 가로등, 계절, 흔적 같은 상투적 이미지를 습관적으로 이어 붙이지 마세요.
첫 2줄에 구체적인 장소와 행동 또는 사물을 보여 주세요.
한 곡 안에서는 하나의 중심 장면과 사건을 유지하고, 갑자기 다른 장소나 사물로 이동하지 마세요.
Chorus의 핵심 문장은 문법적으로 완성된 자연스러운 한국어여야 합니다.
핵심 문장을 반복할 때는 한 줄에 두 번 붙이지 말고 서로 다른 줄에 배치하세요.
Final Chorus는 앞 Chorus에서 최소 한 문장을 바꾸어 화자의 최종 선택을 보여 주세요.
결말은 앞의 감정과 모순되지 않아야 합니다.
각 줄은 노래로 부를 수 있는 길이로 쓰고 설명문처럼 길게 늘이지 마세요.
출력하기 전에 제작 용어, 상투어 과다, 장면 이동, 문법 오류, 결말 충돌을 내부적으로 검사하고 수정한 최종본만 반환하세요.`;
}

function lyricShapeRules(): string {
  return `A안은 다음 구조와 줄 수를 정확히 지키세요.
[Verse 1] 4줄, [Pre-Chorus] 3줄, [Chorus] 4줄, [Verse 2] 4줄, [Bridge] 3줄, [Final Chorus] 4줄, [Outro] 2줄. 실제 가사 총 24줄입니다.
B안은 [Verse 1] 4줄, [Pre-Chorus] 2줄, [Chorus] 4줄, [Verse 2] 4줄, [Bridge] 2줄, [Final Chorus] 4줄. 실제 가사 총 20줄입니다.
A안과 B안은 같은 이야기, 장면, 핵심 문장을 재사용하지 말고 완전히 다른 창작안으로 만드세요.`;
}

function publicationRules(): string {
  return `가사를 완성한 뒤 제목과 해시태그를 만드세요.
제목 3개는 각각 궁금증형, 장면형, Chorus 훅형으로 만들고 서로 달라야 합니다.
영어 제목 3개는 같은 순서의 자연스러운 번역이어야 합니다.
해시태그는 정확히 8개이며 중복 없이 모두 #으로 시작하고 공백이 없어야 합니다.
감정 또는 상황 2개, 장르와 사운드 2개, 감상 상황 2개, 검색 확장 키워드 2개로 구성하세요.
낚시성 문구와 참고곡 제목, 가수 이름은 사용하지 마세요.`;
}

export function buildLyricsPrompt(blueprint: LyricBlueprint, includePublication: boolean): string {
  const output = includePublication
    ? `{
  "lyrics": {
    "a": "구간명이 포함된 A안",
    "b": "구간명이 포함된 B안"
  },
  "titles": ["궁금증형 제목", "장면형 제목", "훅형 제목"],
  "titlesEnglish": ["English Title 1", "English Title 2", "English Title 3"],
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"]
}`
    : `{
  "lyrics": {
    "a": "구간명이 포함된 A안",
    "b": "구간명이 포함된 B안"
  }
}`;

  return `당신은 자연스러운 한국어 문장과 후렴 훅에 강한 대중가요 작사가입니다.
아래 이야기 설계서는 이미 참고곡의 음악 정보를 코드명과 제작 용어 없이 안전하게 번역한 것입니다.
설계서 밖의 원곡, 가수, 코드, 음악 지식을 추측하거나 추가하지 마세요.

이야기 설계서:
${JSON.stringify(blueprint)}

${lyricCoreRules()}
${lyricShapeRules()}
${includePublication ? publicationRules() : ""}

부가 설명이나 Markdown 없이 다음 JSON만 반환하세요.
${output}`;
}

export function buildLyricRepairPrompt(
  blueprint: LyricBlueprint,
  draft: LyricOutput,
  issues: string[],
  includePublication: boolean,
): string {
  const output = includePublication
    ? `{"lyrics":{"a":"수정된 A안","b":"수정된 B안"},"titles":["제목1","제목2","제목3"],"titlesEnglish":["Title 1","Title 2","Title 3"],"hashtags":["#태그1","#태그2","#태그3","#태그4","#태그5","#태그6","#태그7","#태그8"]}`
    : `{"lyrics":{"a":"수정된 A안","b":"수정된 B안"}}`;

  return `당신은 한국 대중가요 가사의 최종 교정자입니다.
아래 초안은 자동 검수에서 탈락했습니다. 좋은 줄은 살리되 지적된 문제를 모두 제거해 전체 결과를 다시 작성하세요.

이야기 설계서:
${JSON.stringify(blueprint)}

자동 검수 문제:
${issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}

초안:
${JSON.stringify(draft)}

${lyricCoreRules()}
${lyricShapeRules()}
${includePublication ? publicationRules() : ""}

부가 설명이나 Markdown 없이 다음 JSON만 반환하세요.
${output}`;
}

const chordSymbolPattern = /(?:^|[\s,(])(?:[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\/[A-G](?:#|b)?)?)(?=$|[\s,.)])/iu;
const productionTermPattern = /(?:\b(?:bpm|key|tempo|chord|dominant|modulation|mix|range)\b|코드|음이름|박자|템포|전조|화음|도미넌트|멜로디|피아노|기타|드럼|베이스|스트링|신스|믹스|음역|마디)/iu;
const clichéTerms = [
  "별빛",
  "바람에 흩어",
  "그림자",
  "가로등",
  "새벽 3시",
  "오래된 레코드",
  "흔적",
  "우리의 이야기",
  "달은 사라져",
  "너의 이름",
  "새로운 계절",
  "빛이 되어",
];

function lyricBodyLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^\[[^\]]+\]$/u.test(line));
}

function inspectOne(label: string, text: string): string[] {
  const issues: string[] = [];
  const lines = lyricBodyLines(text);
  const leaked = lines.filter((line) => chordSymbolPattern.test(line) || productionTermPattern.test(line));
  if (leaked.length > 0) issues.push(`${label}에 코드명 또는 제작 용어가 포함됨: ${leaked.slice(0, 3).join(" / ")}`);

  const clichéCount = clichéTerms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
  if (clichéCount >= 3) issues.push(`${label}에 상투적 이미지가 ${clichéCount}개 이상 사용됨`);

  const duplicatedInLine = lines.filter((line) => {
    const parts = line.split(/[,，]/u).map((part) => part.replace(/[\s.!?…]/gu, "").trim()).filter(Boolean);
    return parts.length >= 2 && parts[0].length >= 4 && parts[0] === parts[1];
  });
  if (duplicatedInLine.length > 0) issues.push(`${label}에서 같은 후렴 문장을 한 줄 안에 반복함: ${duplicatedInLine[0]}`);

  const normalized = lines.map((line) => line.replace(/[\s.!?…,'’]/gu, ""));
  const counts = new Map<string, number>();
  normalized.forEach((line) => counts.set(line, (counts.get(line) ?? 0) + 1));
  const excessive = [...counts.entries()].filter(([line, count]) => line.length >= 5 && count > 2);
  if (excessive.length > 0) issues.push(`${label}에 동일 문장이 과도하게 반복됨: ${excessive[0][0]}`);

  return issues;
}

export function inspectLyrics(result: LyricOutput): string[] {
  return [
    ...inspectOne("A안", result.lyrics.a),
    ...inspectOne("B안", result.lyrics.b),
  ];
}
