import type { GenerateRequest } from "@/lib/types";

function songContext(input: GenerateRequest): string {
  return `아티스트: ${input.artist.name}
참고곡: ${input.song.title}
참고 Key: ${input.song.key ?? "미확인"}
참고 BPM: ${input.song.bpm ?? "미확인"}
박자: ${input.song.timeSignature ?? "미확인"}
참고 구간별 코드: ${JSON.stringify(input.song.sections)}`;
}

function copyrightRules(): string {
  return `선택한 곡은 분위기와 구조를 이해하기 위한 참고 자료일 뿐입니다.
원곡의 멜로디, 가사, 고유 표현, 훅을 복제하거나 변형하지 마세요.
특정 가수의 목소리나 창법을 그대로 흉내 내도록 지시하지 마세요.
결과는 완전히 새로운 창작물이어야 합니다.`;
}

function lyricRules(): string {
  return `한국어로 실제 노래 가사만 작성하세요.
[Verse], Verse, Pre-Chorus, Chorus, Bridge, Outro 같은 구간명과 설명은 절대 넣지 마세요.
A안은 30~36줄, B안은 20~24줄로 작성하고 A안이 B안보다 약 150% 길어야 합니다.
A안과 B안은 주제, 장면, 핵심 표현을 확실히 다르게 만드세요.
첫 4줄 안에 시간, 장소, 행동 또는 사물 중 최소 2개가 드러나는 구체적인 장면을 넣으세요.
각 안에는 시작 장면, 감정의 변화, 마지막 선택이 느껴지는 흐름이 있어야 합니다.
설명문이나 일기처럼 길게 쓰지 말고 한 줄이 자연스럽게 노래로 불릴 수 있게 만드세요.
같은 문장 종결과 같은 단어를 연속해서 반복하지 마세요.
'별이 되어', '새로운 계절', '다시 시작', '빛이 되어', '너의 이름을 불러' 같은 상투적인 문구에 의존하지 마세요.
각 안에는 기억하기 쉬운 핵심 문장 1개를 자연스럽게 2회 반복하되, 그 외 문장은 불필요하게 반복하지 마세요.
약 2분 곡에 맞는 밀도 있는 분량으로 작성하세요.`;
}

function fullPrompt(input: GenerateRequest): string {
  return `당신은 한국 대중음악 창작 보조 AI입니다. 사용자가 결과를 그대로 복사해 사용할 수 있게 완성도 높게 작성하세요.

${copyrightRules()}

선택 정보:
${songContext(input)}

생성 규칙:
1. 전체 곡은 약 2분 안에 완성되는 짧고 밀도 있는 구성으로 설계합니다.
2. 코드는 초중급자가 연주 가능한 수준을 우선하되 지나치게 단순하지 않게 만듭니다.
3. sunoStyle은 Suno에 그대로 넣을 수 있도록 반드시 영어만 사용하고 장르, 악기, 보컬 성격, 템포, 약 2분 전개, 피해야 할 요소를 포함합니다.
4. sunoStyleKorean은 영어 스타일의 의미를 빠짐없이 자연스러운 한국어로 설명합니다.
5. ${lyricRules()}
6. 한국어 제목 3개와 각 제목의 자연스러운 영어 제목 3개를 같은 순서로 만듭니다.
7. 해시태그는 정확히 8개이며 각 항목은 #으로 시작합니다.
8. Markdown 코드블록이나 부가 설명 없이 JSON 객체 하나만 반환합니다.

반환 구조:
{
  "chords": {
    "key": "C",
    "bpm": 96,
    "timeSignature": "4/4",
    "sections": {
      "intro": ["C", "G", "Am", "F"],
      "verse": ["C", "Em", "Am", "F"],
      "preChorus": ["Dm", "Em", "F", "G"],
      "chorus": ["F", "G", "Em", "Am"],
      "bridge": ["Am", "Em", "F", "G"],
      "outro": ["C", "G", "F", "C"]
    }
  },
  "sunoStyle": "English-only Suno style prompt",
  "sunoStyleKorean": "영어 스타일의 한국어 뜻",
  "lyrics": {
    "a": "구간명 없는 30~36줄 가사",
    "b": "구간명 없는 20~24줄 가사"
  },
  "titles": ["한국어 제목1", "한국어 제목2", "한국어 제목3"],
  "titlesEnglish": ["English Title 1", "English Title 2", "English Title 3"],
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"]
}`;
}

function focusedContext(input: GenerateRequest): string {
  if (!input.existing) return "";
  return `현재 Suno 스타일: ${input.existing.sunoStyle}
현재 한국어 제목: ${input.existing.titles.join(", ")}
현재 코드: ${JSON.stringify(input.existing.chords)}`;
}

export function buildGenerationPrompt(input: GenerateRequest): string {
  if (input.target === "all") return fullPrompt(input);

  const base = `당신은 한국 대중음악 창작 보조 AI입니다.
${copyrightRules()}

선택 정보:
${songContext(input)}

기존 결과의 참고 정보:
${focusedContext(input)}

Markdown 코드블록이나 부가 설명 없이 지정된 JSON 객체 하나만 반환하세요.`;

  if (input.target === "lyrics") {
    return `${base}

이번에는 가사만 새로 만드세요. 코드, 스타일, 제목, 해시태그를 다시 만들지 마세요.
${lyricRules()}

반환 구조:
{
  "lyrics": {
    "a": "구간명 없는 30~36줄 가사",
    "b": "구간명 없는 20~24줄 가사"
  }
}`;
  }

  if (input.target === "chords") {
    return `${base}

이번에는 코드만 새로 만드세요. 약 2분 곡에 맞게 인트로를 짧게 하고 초중급자가 연주할 수 있으면서도 감정 변화가 드러나는 진행으로 구성하세요.

반환 구조:
{
  "chords": {
    "key": "C",
    "bpm": 96,
    "timeSignature": "4/4",
    "sections": {
      "intro": ["C", "G", "Am", "F"],
      "verse": ["C", "Em", "Am", "F"],
      "preChorus": ["Dm", "Em", "F", "G"],
      "chorus": ["F", "G", "Em", "Am"],
      "bridge": ["Am", "Em", "F", "G"],
      "outro": ["C", "G", "F", "C"]
    }
  }
}`;
  }

  if (input.target === "style") {
    return `${base}

이번에는 Suno 스타일만 새로 만드세요. sunoStyle은 반드시 영어만 사용하고 장르, 악기, 보컬 성격, 템포, 약 2분 전개, 피해야 할 요소를 한 문단에 포함하세요. sunoStyleKorean은 그 뜻을 정확히 설명하세요.

반환 구조:
{
  "sunoStyle": "English-only Suno style prompt",
  "sunoStyleKorean": "영어 스타일의 한국어 뜻"
}`;
  }

  if (input.target === "titles") {
    return `${base}

이번에는 제목만 새로 만드세요. 가사의 정서를 담되 흔한 발라드 제목을 피하고, 한국어 제목 3개와 자연스러운 영어 제목 3개를 같은 순서로 만드세요.

반환 구조:
{
  "titles": ["한국어 제목1", "한국어 제목2", "한국어 제목3"],
  "titlesEnglish": ["English Title 1", "English Title 2", "English Title 3"]
}`;
  }

  return `${base}

이번에는 해시태그만 새로 만드세요. 검색성과 실제 게시 활용도를 고려해 정확히 8개를 만들고 모두 #으로 시작하세요.

반환 구조:
{
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"]
}`;
}
