import type { MemoryTopic } from "@/lib/memory-song";
import type { MemoryGenerateRequest } from "@/lib/types";

function itemSource(topic: MemoryTopic): string {
  return JSON.stringify(topic.items);
}

function sharedRules(input: MemoryGenerateRequest, topic: MemoryTopic): string {
  return `일반 사용자가 듣기 좋은 교육용 암기송을 만드세요.
주제: ${topic.title}
음악 스타일: ${input.style}

검증된 암기 항목 JSON 배열:
${itemSource(topic)}

절대 규칙:
- 위 배열의 표기, 숫자, 기호, 띄어쓰기, 개수와 순서를 바꾸지 마세요.
- 누락, 추가, 합치기, 순서 변경을 금지합니다.
- 어린이 전용 말투와 과도하게 유아적인 표현을 피하세요.
- 특정 가수, 기존 곡, 목소리 복제를 요청하지 마세요.
- 설명, Markdown, 코드블록 없이 JSON 객체 하나만 반환하세요.`;
}

function lyricRules(): string {
  return `가사 규칙:
- lyrics.a와 lyrics.b 모두 [Intro], [Verse], [Chorus], [Bridge], [Outro]를 포함하세요.
- 두 가사 모두 전체 암기 항목을 정확한 표기와 순서로 최소 한 번 포함하세요.
- A안은 리듬과 반복 중심, B안은 멜로디와 따라 부르기 중심으로 구분하세요.
- 설명 문장보다 실제 암기 항목을 더 많이 사용하세요.
- 긴 목록은 Verse를 여러 개로 나누되 순서는 계속 이어가세요.
- Chorus에는 핵심 순서나 전체 순서를 반복하세요.`;
}

function chordRules(input: MemoryGenerateRequest): string {
  return `코드 규칙:
- ${input.style}에 맞는 key, bpm, timeSignature를 작성하세요.
- chords.sections에는 verse, chorus, bridge를 반드시 넣고 배열을 비우지 마세요.
- 일반적인 코드명만 사용하고 암기 항목 발음이 묻히지 않는 단순한 진행으로 작성하세요.`;
}

function styleRules(input: MemoryGenerateRequest): string {
  return `Suno 스타일 규칙:
- sunoStyle은 영어 한 문단, 약 55~95단어로 작성하세요.
- ${input.style}, 템포, 보컬 전달 방식, 악기, 드럼과 베이스, 분위기, Chorus 반복 방식을 포함하세요.
- 암기 항목과 순서가 또렷하게 들리도록 지시하세요.
- 실존 가수, 곡 제목, in the style of, voice clone 표현을 금지합니다.
- sunoStyleKorean은 같은 내용을 50자 이상의 자연스러운 한국어로 작성하세요.`;
}

function titleRules(topic: MemoryTopic): string {
  return `제목 규칙:
- titles는 서로 다른 한국어 제목 정확히 3개입니다.
- ${topic.title}의 학습 내용이 바로 드러나면서 클릭하고 싶은 제목으로 작성하세요.
- titlesEnglish는 같은 순서의 영어 제목 정확히 3개입니다.`;
}

function hashtagRules(topic: MemoryTopic): string {
  return `해시태그 규칙:
- hashtags는 중복 없이 정확히 8개입니다.
- 모두 #으로 시작하고 공백을 넣지 마세요.
- ${topic.title}, 암기, 공부, 교육, 음악 관련 태그를 포함하세요.`;
}

export function buildMemoryGenerationPrompt(input: MemoryGenerateRequest, topic: MemoryTopic): string {
  const base = sharedRules(input, topic);

  if (input.target === "all") {
    return `${base}

${lyricRules()}
${chordRules(input)}
${styleRules(input)}
${titleRules(topic)}
${hashtagRules(topic)}

반환 키와 구조:
- memorySequence: 위 암기 항목 JSON 배열을 한 글자도 바꾸지 않고 그대로 복사한 배열
- chords: { key, bpm, timeSignature, sections: { verse, chorus, bridge, 필요 시 intro와 outro } }
- sunoStyle: 영어 한 문단
- sunoStyleKorean: 한국어 설명
- lyrics: { a, b }
- titles: 한국어 제목 3개 배열
- titlesEnglish: 영어 제목 3개 배열
- hashtags: 해시태그 8개 배열`;
  }

  if (input.target === "lyrics") {
    return `${base}

이번에는 가사만 다시 만드세요.
${lyricRules()}

반환 구조:
- memorySequence: 위 암기 항목 배열을 그대로 복사
- lyrics: { a, b }`;
  }

  if (input.target === "chords") {
    return `${base}

이번에는 코드만 다시 만드세요.
${chordRules(input)}
반환 구조: { "chords": { "key", "bpm", "timeSignature", "sections" } }`;
  }

  if (input.target === "style") {
    return `${base}

이번에는 Suno 스타일만 다시 만드세요.
${styleRules(input)}
반환 구조: { "sunoStyle": "영어 한 문단", "sunoStyleKorean": "한국어 설명" }`;
  }

  if (input.target === "titles") {
    return `${base}

이번에는 제목만 다시 만드세요.
${titleRules(topic)}
반환 구조: { "titles": [3개], "titlesEnglish": [3개] }`;
  }

  return `${base}

이번에는 해시태그만 다시 만드세요.
${hashtagRules(topic)}
반환 구조: { "hashtags": [8개] }`;
}
