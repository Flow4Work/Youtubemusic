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
  return `선택한 곡은 음악적 특징을 분석하기 위한 참고 자료일 뿐입니다.
원곡의 멜로디, 가사, 고유 표현, 제목, 훅, 코드 진행 전체를 복제하거나 가볍게 바꾸어 재사용하지 마세요.
특정 가수의 목소리나 창법을 그대로 흉내 내도록 지시하지 마세요.
원곡에서 참고할 수 있는 것은 조성, 템포 감각, 화성의 밀도, 전조 방식, 구간별 긴장 변화, 악기 역할과 감정 곡선 같은 추상적인 특징뿐입니다.
결과는 독립적인 신곡으로 인식될 만큼 완전히 새로워야 합니다.`;
}

function referenceAnalysisRules(): string {
  return `결과를 만들기 전에 참고곡의 매력 포인트를 내부적으로 분석하세요.
분석 항목은 조성과 장단조의 정서, BPM과 체감 속도, 주요 코드의 색채, 비다이어토닉 코드와 전조, Verse와 Chorus의 대비, 감정이 가장 크게 올라가는 구간, 기억에 남는 리듬 또는 편곡 방식입니다.
공개된 코드 구간이 비어 있다면 임의로 원곡 코드를 추측하지 말고 확인 가능한 Key, BPM, 박자와 일반적인 장르 문법만 사용하세요.
분석 결과를 설명문으로 출력하지 말고 가사, 코드, 스타일, 제목과 해시태그에 자연스럽게 반영하세요.`;
}

function youtubeRules(): string {
  return `YouTube에 올렸을 때 첫인상과 재생 지속에 도움이 되도록 설계하세요.
첫 10초 안에 분위기를 이해할 수 있는 짧은 인트로, 첫 Verse의 구체적인 장면, Chorus의 기억하기 쉬운 핵심 문장, 마지막 Chorus의 확실한 감정 보상을 우선하세요.
억지스러운 자극, 낚시성 문구, 과도한 유행어 대신 한 번에 이해되면서도 다음 문장이 궁금한 표현을 사용하세요.
제목과 해시태그는 검색성과 클릭 가능성을 고려하되 실제 가사와 음악 내용에 정확히 맞아야 합니다.
모든 결과는 같은 곡을 위해 만들어진 것처럼 Key, BPM, 코드, 가사 정서, 스타일, 제목과 해시태그가 서로 일관되어야 합니다.`;
}

function lyricRules(): string {
  return `한국어로 실제 노래 가사를 작성하세요.
각 구간 시작에는 반드시 영어 구간명을 대괄호로 표시하세요. 사용할 수 있는 표시는 [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus], [Outro]입니다.
구간명 외의 설명, 작곡 지시, 괄호 속 해설은 넣지 마세요.
A안의 실제 가사 문장은 24~28줄, B안은 20~24줄로 작성하세요. 구간명 줄은 가사 문장 수에 포함하지 마세요.
A안은 기존 분량보다 약 20% 짧고 밀도 있게 구성하되 B안보다는 조금 더 풍부하게 만드세요.
A안과 B안은 주제, 장면, 핵심 표현을 확실히 다르게 만드세요.
첫 Verse의 첫 2줄만 읽어도 시간, 장소, 행동 또는 사물 중 최소 2개가 보이게 하여 바로 장면에 들어가게 만드세요.
첫 4줄 안에 듣는 사람이 다음 상황을 궁금해할 작은 질문이나 미완성된 감정을 남기세요.
Chorus에는 7~14자 정도의 기억하기 쉬운 핵심 문장 하나를 넣고 자연스럽게 2회 반복하세요.
각 안에는 시작 장면, 감정의 변화, 마지막 선택 또는 깨달음이 느껴지는 흐름이 있어야 합니다.
Final Chorus는 앞 Chorus의 단순 반복이 아니라 한 문장 이상을 바꾸어 감정의 결론을 보여 주세요.
설명문이나 일기처럼 길게 쓰지 말고 한 줄이 자연스럽게 노래로 불릴 수 있게 만드세요.
같은 문장 종결과 같은 단어를 연속해서 반복하지 마세요.
'별이 되어', '새로운 계절', '다시 시작', '빛이 되어', '너의 이름을 불러' 같은 상투적인 문구에 의존하지 마세요.
약 2분 곡에 맞는 밀도 있는 분량으로 작성하세요.`;
}

function chordRules(): string {
  return `코드는 선택한 곡의 Key, BPM, 화성 밀도와 전조 감각을 참고하되 원곡 진행을 그대로 반복하지 않는 새로운 진행으로 만드세요.
intro, verse, preChorus, chorus, bridge, finalChorus, outro 중 곡에 필요한 구간을 사용하고 Verse와 Chorus는 반드시 비어 있지 않아야 합니다.
인트로는 2~4마디 정도로 짧게 시작하고, Pre-Chorus에서는 베이스 진행 또는 도미넌트 긴장으로 상승감을 만들며, Chorus에서는 Verse보다 음역과 화성의 개방감이 커지게 하세요.
Bridge 또는 Final Chorus에는 대리화음, 차용화음, 베이스 전위, 일시적 전조 중 하나를 사용해 새로움을 주세요.
초중급자가 연주할 수 있는 수준을 유지하되, 선택한 곡에 7th, maj7, slash chord 같은 색채가 많다면 적절히 반영하세요.
원곡과 동일한 긴 코드 배열을 복제하지 말고 각 구간이 약 2분 구성과 기억하기 쉬운 훅을 지원하도록 설계하세요.`;
}

function styleRules(): string {
  return `sunoStyle은 Suno의 Style 입력란에 그대로 붙여 넣을 수 있는 영어 문장 하나로 작성하세요.
참고곡의 Key, BPM, 박자, 코드 밀도, 비다이어토닉 코드, 전조 여부와 구간별 긴장 변화를 분석해 실제 곡에 맞는 편곡 방향을 제시하세요.
장르 이름만 나열하지 말고 다음 요소를 구체적으로 포함하세요: 체감 템포와 그루브, 핵심 악기 3~5개, 드럼과 베이스 움직임, 보컬의 음색과 강약 변화, Verse에서 Chorus까지의 편곡 상승, Bridge 또는 Final Chorus의 변화, 공간감과 믹스 질감, 마지막 마무리 방식.
장조와 단조, 느린 발라드와 미디엄 템포, 단순 진행과 재즈 확장 코드의 차이를 반드시 반영하세요.
현재 생성된 가사가 있다면 첫 장면, 핵심 문장과 마지막 감정 결론에도 맞추세요.
YouTube에서 첫 10초 안에 곡의 분위기가 잡히도록 인트로 악기와 첫 보컬 진입 방식을 구체적으로 지시하세요.
'beautiful', 'emotional', 'powerful'처럼 구체성이 없는 단어만 반복하지 말고 실제 소리와 연주 방식으로 표현하세요.
아티스트 이름, 참고곡 제목, 'in the style of', 원곡 복제, 동일한 멜로디를 요구하는 표현은 절대 넣지 마세요.
약 70~110단어의 한 문단으로 작성하고 영어 외 언어는 넣지 마세요.
sunoStyleKorean은 영어 스타일에서 지시한 편곡, 보컬, 전개와 믹스 내용을 빠짐없이 자연스러운 한국어로 설명하세요.`;
}

function titleRules(): string {
  return `한국어 제목은 정확히 3개를 만들고 서로 다른 전략을 사용하세요.
1번은 가사의 핵심 갈등이 궁금해지는 짧은 궁금증형, 2번은 시간이나 장소 또는 사물이 보이는 장면형, 3번은 Chorus의 핵심 문장을 살린 훅형으로 만드세요.
각 제목은 2~10음절을 우선하고 한눈에 읽히게 하며, 지나치게 흔한 '사랑', '이별', '그대', '추억' 단독 제목은 피하세요.
검색을 위해 실제 가사에 없는 키워드를 억지로 넣거나 참고곡 제목과 비슷하게 만들지 마세요.
영어 제목 3개는 한국어 제목의 의미와 분위기를 자연스럽게 옮기고 같은 순서로 맞추세요.`;
}

function hashtagRules(): string {
  return `해시태그는 정확히 8개이며 중복 없이 모두 #으로 시작해야 합니다.
구성은 곡의 감정 또는 상황 2개, 장르와 사운드 2개, 영상 또는 감상 상황 2개, 검색 확장용 구체 키워드 2개로 균형 있게 만드세요.
#음악, #노래, #감성처럼 지나치게 넓은 태그만 채우지 말고 실제 생성된 가사, Key와 템포, 편곡 분위기에 맞는 구체적인 표현을 사용하세요.
가수 이름이나 참고곡 제목은 넣지 마세요.`;
}

function lyricExcerpt(input: GenerateRequest): string {
  if (!input.existing) return "없음";
  return input.existing.lyrics.a
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 16)
    .join(" / ");
}

function fullPrompt(input: GenerateRequest): string {
  return `당신은 한국 대중음악 창작과 YouTube 업로드용 패키지를 설계하는 전문 프로듀서입니다.

${copyrightRules()}
${referenceAnalysisRules()}
${youtubeRules()}

선택 정보:
${songContext(input)}

생성 규칙:
1. 전체 곡은 약 2분 안에 완성되는 짧고 밀도 있는 구성으로 설계합니다.
2. ${chordRules()}
3. ${styleRules()}
4. ${lyricRules()}
5. ${titleRules()}
6. ${hashtagRules()}
7. Markdown 코드블록이나 부가 설명 없이 JSON 객체 하나만 반환합니다.

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
      "finalChorus": ["F", "G", "Am", "C/E"],
      "outro": ["C", "G", "F", "C"]
    }
  },
  "sunoStyle": "Song-specific English Suno production prompt",
  "sunoStyleKorean": "영어 스타일의 구체적인 한국어 설명",
  "lyrics": {
    "a": "[Verse 1]\\n가사...\\n[Pre-Chorus]\\n가사...\\n[Chorus]\\n가사...\\n[Verse 2]\\n가사...\\n[Bridge]\\n가사...\\n[Final Chorus]\\n가사...\\n[Outro]\\n가사...",
    "b": "[Verse 1]\\n가사...\\n[Pre-Chorus]\\n가사...\\n[Chorus]\\n가사...\\n[Bridge]\\n가사...\\n[Final Chorus]\\n가사..."
  },
  "titles": ["궁금증형 제목", "장면형 제목", "훅형 제목"],
  "titlesEnglish": ["English Title 1", "English Title 2", "English Title 3"],
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"]
}`;
}

function focusedContext(input: GenerateRequest): string {
  if (!input.existing) return "";
  return `현재 Suno 스타일: ${input.existing.sunoStyle}
현재 한국어 제목: ${input.existing.titles.join(", ")}
현재 코드: ${JSON.stringify(input.existing.chords)}
현재 가사 A안 일부: ${lyricExcerpt(input)}`;
}

export function buildGenerationPrompt(input: GenerateRequest): string {
  if (input.target === "all") return fullPrompt(input);

  const base = `당신은 한국 대중음악 창작과 YouTube 업로드용 패키지를 설계하는 전문 프로듀서입니다.
${copyrightRules()}
${referenceAnalysisRules()}
${youtubeRules()}

선택 정보:
${songContext(input)}

기존 결과의 참고 정보:
${focusedContext(input)}

Markdown 코드블록이나 부가 설명 없이 지정된 JSON 객체 하나만 반환하세요.`;

  if (input.target === "lyrics") {
    return `${base}

이번에는 가사만 새로 만드세요. 코드, 스타일, 제목, 해시태그를 다시 만들지 마세요.
현재 코드와 스타일의 Key, BPM, Chorus 상승감에 정확히 맞춰 가사를 작성하세요.
${lyricRules()}

반환 구조:
{
  "lyrics": {
    "a": "[Verse 1]\\n가사...\\n[Pre-Chorus]\\n가사...\\n[Chorus]\\n가사...\\n[Verse 2]\\n가사...\\n[Bridge]\\n가사...\\n[Final Chorus]\\n가사...\\n[Outro]\\n가사...",
    "b": "[Verse 1]\\n가사...\\n[Pre-Chorus]\\n가사...\\n[Chorus]\\n가사...\\n[Bridge]\\n가사...\\n[Final Chorus]\\n가사..."
  }
}`;
  }

  if (input.target === "chords") {
    return `${base}

이번에는 코드만 새로 만드세요. 현재 가사의 장면, Chorus 핵심 문장과 스타일의 악기 상승을 지원하도록 설계하세요.
${chordRules()}

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
      "finalChorus": ["F", "G", "Am", "C/E"],
      "outro": ["C", "G", "F", "C"]
    }
  }
}`;
  }

  if (input.target === "style") {
    return `${base}

이번에는 Suno 스타일만 새로 만드세요. 이전 스타일 문장을 단순히 바꾸지 말고 참고곡의 음악 정보와 현재 생성된 코드 및 가사를 다시 분석해 더 잘 맞는 편곡 프롬프트를 새로 작성하세요.
${styleRules()}

반환 구조:
{
  "sunoStyle": "Song-specific English Suno production prompt",
  "sunoStyleKorean": "영어 스타일의 구체적인 한국어 설명"
}`;
  }

  if (input.target === "titles") {
    return `${base}

이번에는 제목만 새로 만드세요. 현재 가사의 첫 장면, Chorus 핵심 문장과 마지막 결론을 기준으로 YouTube에서 읽기 쉽고 궁금증이 생기는 제목을 작성하세요.
${titleRules()}

반환 구조:
{
  "titles": ["궁금증형 제목", "장면형 제목", "훅형 제목"],
  "titlesEnglish": ["English Title 1", "English Title 2", "English Title 3"]
}`;
  }

  return `${base}

이번에는 해시태그만 새로 만드세요. 현재 가사, 제목, 장르와 실제 편곡 내용을 기준으로 검색성과 내용 일치도를 함께 높이세요.
${hashtagRules()}

반환 구조:
{
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8"]
}`;
}
