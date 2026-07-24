import type { MemoryTopic } from "@/lib/memory-song";
import type { MemoryGenerateRequest } from "@/lib/types";

function numberedItems(topic: MemoryTopic): string {
  return topic.items.map((item) => `- ${item}`).join("\n");
}

function existingContext(input: MemoryGenerateRequest): string {
  if (!input.existing) return "기존 결과 없음";
  return `현재 코드: ${JSON.stringify(input.existing.chords)}
현재 Suno 스타일: ${input.existing.sunoStyle}
현재 제목: ${input.existing.titles.join(", ")}
현재 가사 A안: ${input.existing.lyrics.a}`;
}

function sharedRules(input: MemoryGenerateRequest, topic: MemoryTopic): string {
  return `당신은 일반 사용자가 듣기 좋은 암기송을 만드는 교육 음악 프로듀서입니다.
어린이 전용 말투나 과도하게 유아적인 표현을 사용하지 마세요.

암기 주제: ${topic.title}
선택 음악 스타일: ${input.style}

아래 암기 항목은 검증된 원본 데이터입니다.
표기, 숫자, 기호, 띄어쓰기, 순서를 임의로 바꾸지 마세요.
누락, 새 항목 추가, 항목 합치기, 순서 변경을 금지합니다.

암기 항목:
${numberedItems(topic)}

공통 품질 규칙:
- 설명보다 실제 암기 항목이 더 많이 들리게 작성하세요.
- 각 가사에는 위 전체 항목이 정확한 표기와 순서로 최소 한 번 이어져야 합니다.
- 반복은 허용하지만, 원본 순서 한 묶음 안에서는 누락과 중복을 만들지 마세요.
- 후렴에서는 핵심 순서 또는 전체 순서를 리듬감 있게 반복하세요.
- 자연스러운 연결 문장은 짧게 쓰고 사실 관계를 새로 지어내지 마세요.
- 특정 실존 가수의 목소리, 창법, 곡을 복제하도록 요청하지 마세요.
- Markdown 코드블록과 부가 설명 없이 유효한 JSON 객체 하나만 반환하세요.`;
}

function lyricRules(): string {
  return `가사 규칙:
- 한국어를 기본으로 하되 영어 학습 항목은 원문 영어를 그대로 유지하세요.
- A안과 B안 모두 [Intro], [Verse], [Chorus], [Bridge], [Outro] 구간을 사용하세요.
- 필요하면 [Verse 1], [Verse 2]처럼 Verse 번호를 붙일 수 있습니다.
- 구간명 외의 제작 지시나 괄호 설명은 넣지 마세요.
- A안은 리듬과 반복 중심, B안은 멜로디와 따라 부르기 중심으로 차이를 주세요.
- 두 안 모두 전체 암기 항목을 정확한 표기와 순서로 포함하세요.
- 긴 목록은 Verse 여러 개로 나누되 항목 순서는 계속 이어져야 합니다.
- 마지막 Chorus 또는 Outro에서 전체 흐름을 다시 떠올릴 수 있게 마무리하세요.`;
}

function chordRules(input: MemoryGenerateRequest): string {
  return `코드 규칙:
- ${input.style}에 어울리는 Key, BPM, 4/4 중심의 박자를 제안하세요.
- sections에는 반드시 verse, chorus, bridge를 포함하고 각 배열을 비워 두지 마세요.
- 필요하면 intro와 outro를 추가하세요.
- Suno 또는 실제 작곡 참고용으로 바로 쓸 수 있는 일반적인 코드명만 사용하세요.
- 암기 항목의 발음이 묻히지 않도록 지나치게 복잡한 진행은 피하세요.`;
}

function styleRules(input: MemoryGenerateRequest): string {
  return `Suno 스타일 규칙:
- sunoStyle은 영어 한 문단으로 작성하세요.
- 선택 장르 ${input.style}, 구체적인 BPM 또는 템포 감각, 보컬 전달 방식, 핵심 악기, 드럼과 베이스, 분위기, Chorus 반복 방식을 포함하세요.
- 모든 암기 항목이 또렷하게 들리고 순서를 따라가기 쉬워야 한다는 지시를 포함하세요.
- 약 55~95단어로 불필요하게 길지 않게 작성하세요.
- 아티스트 이름, 참고곡 제목, in the style of, voice clone 표현을 넣지 마세요.
- sunoStyleKorean은 같은 내용을 자연스러운 한국어로 설명하세요.`;
}

function titleRules(topic: MemoryTopic): string {
  return `제목 규칙:
- 한국어 제목은 정확히 3개이며 서로 달라야 합니다.
- 클릭하고 싶으면서도 '${topic.title}'의 학습 내용이 바로 드러나야 합니다.
- 과장되거나 학습 범위를 오해하게 하는 문구를 사용하지 마세요.
- titlesEnglish는 같은 순서의 짧고 자연스러운 영어 제목 3개로 작성하세요.`;
}

function hashtagRules(topic: MemoryTopic): string {
  return `해시태그 규칙:
- 정확히 8개, 중복 없이 모두 #으로 시작하고 공백을 넣지 마세요.
- '${topic.title}'의 주제, 암기, 공부, 교육, 음악 관련 태그를 균형 있게 구성하세요.
- 너무 넓은 태그만 반복하지 말고 실제 주제를 식별할 수 있는 태그를 포함하세요.`;
}

export function buildMemoryGenerationPrompt(input: MemoryGenerateRequest, topic: MemoryTopic): string {
  const base = `${sharedRules(input, topic)}

기존 결과 참고:
${existingContext(input)}`;

  if (input.target === "all") {
    return `${base}

${lyricRules()}
${chordRules(input)}
${styleRules(input)}
${titleRules(topic)}
${hashtagRules(topic)}

memorySequence는 위 암기 항목 배열을 한 글자도 바꾸지 않고 같은 순서로 복사하세요.
반환 구조:
{
  "memorySequence": ${JSON.stringify(topic.items)},
  "chords": {
    "key": "C major",
    "bpm": 110,
    "timeSignature": "4/4",
    "sections": {
      "intro": ["C", "G"],
      "verse": ["C", "G", "Am", "F"],
      "chorus": ["F", "G", "C", "Am"],
      "bridge": ["Dm", "Am", "F", "G"],
      "outro": ["C", "G", "C"]
    }
  },
  "sunoStyle": "Concise English Suno style paragraph",
  "sunoStyleKorean": "영어 스타일의 한국어 설명",
  "lyrics": {
    "a": "[Intro]부터 [Outro]까지 전체 항목을 정확히 포함한 A안",
    "b": "[Intro]부터 [Outro]까지 전체 항목을 정확히 포함한 B안"
  },
  "titles": ["한국어 제목 1", "한국어 제목 2", "한국어 제목 3"],
  "titlesEnglish": ["English Title 1", "English Title 2", "English Title 3"],
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"]
}`;
  }

  if (input.target === "lyrics") {
    return `${base}

이번에는 가사만 다시 만드세요. 코드, 스타일, 제목과 해시태그는 만들지 마세요.
${lyricRules()}

memorySequence는 위 암기 항목 배열을 한 글자도 바꾸지 않고 같은 순서로 복사하세요.
반환 구조:
{
  "memorySequence": ${JSON.stringify(topic.items)},
  "lyrics": {
    "a": "전체 항목을 정확히 포함한 A안",
    "b": "전체 항목을 정확히 포함한 B안"
  }
}`;
  }

  if (input.target === "chords") {
    return `${base}

이번에는 코드만 다시 만드세요.
${chordRules(input)}

반환 구조:
{
  "chords": {
    "key": "C major",
    "bpm": 110,
    "timeSignature": "4/4",
    "sections": {
      "intro": ["C", "G"],
      "verse": ["C", "G", "Am", "F"],
      "chorus": ["F", "G", "C", "Am"],
      "bridge": ["Dm", "Am", "F", "G"],
      "outro": ["C", "G", "C"]
    }
  }
}`;
  }

  if (input.target === "style") {
    return `${base}

이번에는 Suno 스타일만 다시 만드세요.
${styleRules(input)}

반환 구조:
{
  "sunoStyle": "Concise English Suno style paragraph",
  "sunoStyleKorean": "영어 스타일의 한국어 설명"
}`;
  }

  if (input.target === "titles") {
    return `${base}

이번에는 제목만 다시 만드세요.
${titleRules(topic)}

반환 구조:
{
  "titles": ["한국어 제목 1", "한국어 제목 2", "한국어 제목 3"],
  "titlesEnglish": ["English Title 1", "English Title 2", "English Title 3"]
}`;
  }

  return `${base}

이번에는 해시태그만 다시 만드세요.
${hashtagRules(topic)}

반환 구조:
{
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"]
}`;
}
