import type { ChordResult, GenerationResult, MemorySongStyle } from "@/lib/types";

export const MEMORY_STYLES = [
  "밝은 팝",
  "쉬운 랩",
  "동요 느낌",
  "K-pop",
  "EDM",
  "어쿠스틱",
  "힙합",
  "발라드",
] as const satisfies readonly MemorySongStyle[];

export interface MemoryTopic {
  id: string;
  title: string;
  items: readonly string[];
  recommendedStyles: readonly [MemorySongStyle, MemorySongStyle, MemorySongStyle];
}

const HISTORY_STYLES = ["쉬운 랩", "힙합", "K-pop"] as const;
const SCIENCE_STYLES = ["EDM", "쉬운 랩", "밝은 팝"] as const;
const LANGUAGE_STYLES = ["밝은 팝", "쉬운 랩", "어쿠스틱"] as const;
const GEOGRAPHY_STYLES = ["K-pop", "밝은 팝", "쉬운 랩"] as const;
const TEN_COMMANDMENTS_STYLES = ["어쿠스틱", "발라드", "밝은 팝"] as const;

export const MEMORY_TOPICS: readonly MemoryTopic[] = [
  {
    id: "joseon-kings-27",
    title: "조선시대 왕 27명 순서",
    recommendedStyles: HISTORY_STYLES,
    items: [
      "1. 태조", "2. 정종", "3. 태종", "4. 세종", "5. 문종", "6. 단종", "7. 세조", "8. 예종", "9. 성종",
      "10. 연산군", "11. 중종", "12. 인종", "13. 명종", "14. 선조", "15. 광해군", "16. 인조", "17. 효종",
      "18. 현종", "19. 숙종", "20. 경종", "21. 영조", "22. 정조", "23. 순조", "24. 헌종", "25. 철종", "26. 고종", "27. 순종",
    ],
  },
  {
    id: "goryeo-kings-34",
    title: "고려시대 왕 34명 순서",
    recommendedStyles: HISTORY_STYLES,
    items: [
      "1. 태조", "2. 혜종", "3. 정종", "4. 광종", "5. 경종", "6. 성종", "7. 목종", "8. 현종", "9. 덕종",
      "10. 정종", "11. 문종", "12. 순종", "13. 선종", "14. 헌종", "15. 숙종", "16. 예종", "17. 인종",
      "18. 의종", "19. 명종", "20. 신종", "21. 희종", "22. 강종", "23. 고종", "24. 원종", "25. 충렬왕",
      "26. 충선왕", "27. 충숙왕", "28. 충혜왕", "29. 충목왕", "30. 충정왕", "31. 공민왕", "32. 우왕", "33. 창왕", "34. 공양왕",
    ],
  },
  {
    id: "korean-modern-history",
    title: "한국 근현대사 주요 사건과 연도",
    recommendedStyles: HISTORY_STYLES,
    items: [
      "1876년 강화도 조약", "1894년 동학 농민 운동", "1894년 갑오개혁", "1895년 을미사변", "1897년 대한제국 수립",
      "1905년 을사늑약", "1910년 국권 피탈", "1919년 3·1 운동", "1919년 대한민국 임시정부 수립", "1945년 광복",
      "1948년 대한민국 정부 수립", "1950년 한국 전쟁", "1960년 4·19 혁명", "1961년 5·16 군사정변", "1972년 유신 헌법",
      "1979년 10·26 사건", "1980년 5·18 민주화운동", "1987년 6월 민주항쟁", "1988년 서울 올림픽", "1997년 외환 위기",
      "2000년 6·15 남북 공동선언",
    ],
  },
  {
    id: "us-presidents",
    title: "미국 대통령 순서",
    recommendedStyles: HISTORY_STYLES,
    items: [
      "1. 조지 워싱턴", "2. 존 애덤스", "3. 토머스 제퍼슨", "4. 제임스 매디슨", "5. 제임스 먼로", "6. 존 퀸시 애덤스",
      "7. 앤드루 잭슨", "8. 마틴 밴 뷰런", "9. 윌리엄 헨리 해리슨", "10. 존 타일러", "11. 제임스 K. 포크",
      "12. 재커리 테일러", "13. 밀러드 필모어", "14. 프랭클린 피어스", "15. 제임스 뷰캐넌", "16. 에이브러햄 링컨",
      "17. 앤드루 존슨", "18. 율리시스 S. 그랜트", "19. 러더퍼드 B. 헤이스", "20. 제임스 A. 가필드",
      "21. 체스터 A. 아서", "22. 그로버 클리블랜드", "23. 벤저민 해리슨", "24. 그로버 클리블랜드",
      "25. 윌리엄 매킨리", "26. 시어도어 루스벨트", "27. 윌리엄 하워드 태프트", "28. 우드로 윌슨",
      "29. 워런 G. 하딩", "30. 캘빈 쿨리지", "31. 허버트 후버", "32. 프랭클린 D. 루스벨트", "33. 해리 S. 트루먼",
      "34. 드와이트 D. 아이젠하워", "35. 존 F. 케네디", "36. 린든 B. 존슨", "37. 리처드 닉슨", "38. 제럴드 포드",
      "39. 지미 카터", "40. 로널드 레이건", "41. 조지 H. W. 부시", "42. 빌 클린턴", "43. 조지 W. 부시",
      "44. 버락 오바마", "45. 도널드 트럼프", "46. 조 바이든", "47. 도널드 트럼프",
    ],
  },
  {
    id: "elements-1-20",
    title: "원소번호 1번부터 20번",
    recommendedStyles: SCIENCE_STYLES,
    items: [
      "1번 수소 H", "2번 헬륨 He", "3번 리튬 Li", "4번 베릴륨 Be", "5번 붕소 B", "6번 탄소 C", "7번 질소 N",
      "8번 산소 O", "9번 플루오린 F", "10번 네온 Ne", "11번 나트륨 Na", "12번 마그네슘 Mg", "13번 알루미늄 Al",
      "14번 규소 Si", "15번 인 P", "16번 황 S", "17번 염소 Cl", "18번 아르곤 Ar", "19번 칼륨 K", "20번 칼슘 Ca",
    ],
  },
  {
    id: "confusing-element-symbols",
    title: "헷갈리는 원소기호",
    recommendedStyles: SCIENCE_STYLES,
    items: [
      "나트륨 Na", "칼륨 K", "철 Fe", "구리 Cu", "은 Ag", "주석 Sn", "안티모니 Sb", "텅스텐 W", "수은 Hg",
      "납 Pb", "금 Au", "아연 Zn", "백금 Pt", "코발트 Co", "망가니즈 Mn",
    ],
  },
  {
    id: "cell-organelles",
    title: "세포 소기관과 기능",
    recommendedStyles: SCIENCE_STYLES,
    items: [
      "핵 - 유전 정보를 저장하고 세포 활동을 조절", "리보솜 - 단백질을 합성", "소포체 - 단백질과 지질을 합성하고 운반",
      "골지체 - 물질을 가공하고 포장하여 분비", "미토콘드리아 - 세포 호흡으로 에너지를 생산", "리소좀 - 노폐물과 낡은 소기관을 분해",
      "세포막 - 물질의 출입을 조절", "세포질 - 세포 소기관이 있는 반유동성 공간", "엽록체 - 광합성을 수행",
      "액포 - 물과 양분 및 노폐물을 저장", "세포벽 - 식물 세포의 형태를 유지하고 보호", "중심체 - 세포 분열 때 방추사를 형성",
    ],
  },
  {
    id: "biological-classification",
    title: "생물 분류 단계",
    recommendedStyles: SCIENCE_STYLES,
    items: ["역", "계", "문", "강", "목", "과", "속", "종"],
  },
  {
    id: "countries-capitals",
    title: "주요 국가와 수도",
    recommendedStyles: GEOGRAPHY_STYLES,
    items: [
      "대한민국 - 서울", "일본 - 도쿄", "중국 - 베이징", "몽골 - 울란바토르", "태국 - 방콕", "베트남 - 하노이",
      "인도 - 뉴델리", "필리핀 - 마닐라", "미국 - 워싱턴 D.C.", "캐나다 - 오타와",
      "멕시코 - 멕시코시티", "영국 - 런던", "프랑스 - 파리", "독일 - 베를린", "이탈리아 - 로마", "스페인 - 마드리드",
      "러시아 - 모스크바", "호주 - 캔버라", "뉴질랜드 - 웰링턴", "브라질 - 브라질리아", "아르헨티나 - 부에노스아이레스",
      "이집트 - 카이로",
    ],
  },
  {
    id: "korea-regions-capitals",
    title: "대한민국 시도와 도청 소재지",
    recommendedStyles: GEOGRAPHY_STYLES,
    items: [
      "서울특별시 - 서울", "부산광역시 - 부산", "대구광역시 - 대구", "인천광역시 - 인천", "광주광역시 - 광주",
      "대전광역시 - 대전", "울산광역시 - 울산", "세종특별자치시 - 세종", "경기도 - 수원", "강원특별자치도 - 춘천",
      "충청북도 - 청주", "충청남도 - 홍성", "전북특별자치도 - 전주", "전라남도 - 무안", "경상북도 - 안동",
      "경상남도 - 창원", "제주특별자치도 - 제주",
    ],
  },
  {
    id: "geometry-formulas",
    title: "도형의 넓이와 부피 공식",
    recommendedStyles: SCIENCE_STYLES,
    items: [
      "직사각형 넓이 = 가로 × 세로", "정사각형 넓이 = 한 변 × 한 변", "삼각형 넓이 = 밑변 × 높이 ÷ 2",
      "평행사변형 넓이 = 밑변 × 높이", "사다리꼴 넓이 = 윗변과 아랫변의 합 × 높이 ÷ 2", "마름모 넓이 = 두 대각선의 곱 ÷ 2",
      "원 넓이 = 원주율 × 반지름 × 반지름", "직육면체 부피 = 가로 × 세로 × 높이", "정육면체 부피 = 한 변 × 한 변 × 한 변",
      "원기둥 부피 = 밑면 넓이 × 높이", "원뿔 부피 = 밑면 넓이 × 높이 ÷ 3", "구 부피 = 4 ÷ 3 × 원주율 × 반지름의 세제곱",
    ],
  },
  {
    id: "unit-conversions",
    title: "길이, 넓이, 부피, 무게 단위 변환",
    recommendedStyles: SCIENCE_STYLES,
    items: [
      "1센티미터 = 10밀리미터", "1미터 = 100센티미터", "1킬로미터 = 1000미터", "1제곱미터 = 10000제곱센티미터",
      "1헥타르 = 10000제곱미터", "1제곱킬로미터 = 100헥타르", "1리터 = 1000밀리리터", "1세제곱미터 = 1000리터",
      "1그램 = 1000밀리그램", "1킬로그램 = 1000그램", "1톤 = 1000킬로그램",
    ],
  },
  {
    id: "irregular-verbs",
    title: "불규칙동사 3단 변화",
    recommendedStyles: LANGUAGE_STYLES,
    items: [
      "be - was, were - been", "begin - began - begun", "break - broke - broken", "bring - brought - brought",
      "buy - bought - bought", "come - came - come", "do - did - done", "drink - drank - drunk", "drive - drove - driven",
      "eat - ate - eaten", "find - found - found", "get - got - got, gotten", "give - gave - given", "go - went - gone",
      "know - knew - known", "make - made - made", "read - read - read", "run - ran - run", "see - saw - seen",
      "speak - spoke - spoken", "take - took - taken", "write - wrote - written",
    ],
  },
  {
    id: "common-korean-spelling",
    title: "자주 틀리는 맞춤법",
    recommendedStyles: LANGUAGE_STYLES,
    items: [
      "며칠이 맞고 몇일은 틀림", "웬일이 맞고 왠일은 틀림", "금세가 맞고 금새는 틀림", "어이없다가 맞고 어의없다는 틀림",
      "역할이 맞고 역활은 틀림", "설렘이 맞고 설레임은 틀림", "바라가 맞고 바래는 상황에 따라 다름", "되와 돼는 되어로 바꿔 확인",
      "안과 않은 아니와 아니하로 바꿔 확인", "낫다, 낳다, 낮다는 뜻으로 구분", "맞히다와 맞추다는 정답 여부와 비교로 구분",
      "어떡해는 어떻게 해의 준말", "왠지는 왜인지의 준말", "뵈요가 아니라 봬요", "할게가 맞고 할께는 틀림",
    ],
  },
  {
    id: "essential-four-character-idioms",
    title: "필수 사자성어",
    recommendedStyles: LANGUAGE_STYLES,
    items: [
      "각골난망 - 은혜를 잊지 못함", "고진감래 - 고생 끝에 즐거움이 옴", "과유불급 - 지나침은 모자람과 같음",
      "금상첨화 - 좋은 일에 좋은 일이 더해짐", "동문서답 - 묻는 말과 전혀 다른 대답", "마이동풍 - 남의 말을 귀담아듣지 않음",
      "새옹지마 - 인생의 길흉은 예측하기 어려움", "설상가상 - 어려운 일에 어려움이 더해짐", "온고지신 - 옛것을 익혀 새것을 앎",
      "유비무환 - 미리 준비하면 걱정이 없음", "이심전심 - 말하지 않아도 마음이 통함", "일석이조 - 한 가지 일로 두 가지 이익",
      "자업자득 - 자신이 한 일의 결과를 자신이 받음", "전화위복 - 화가 바뀌어 복이 됨", "지피지기 - 상대와 자신을 알면 위태롭지 않음",
      "청출어람 - 제자가 스승보다 나아짐", "타산지석 - 남의 잘못도 자신의 교훈이 됨", "호연지기 - 넓고 큰 올바른 기운",
    ],
  },
  {
    id: "korean-nine-parts-of-speech",
    title: "국어 9품사",
    recommendedStyles: LANGUAGE_STYLES,
    items: [
      "명사 - 사람이나 사물의 이름", "대명사 - 명사를 대신하는 말", "수사 - 수량이나 순서를 나타내는 말",
      "조사 - 체언 뒤에 붙어 관계를 나타내는 말", "동사 - 동작이나 작용을 나타내는 말", "형용사 - 성질이나 상태를 나타내는 말",
      "관형사 - 체언을 꾸미는 말", "부사 - 용언이나 다른 말을 꾸미는 말", "감탄사 - 느낌과 부름 및 대답을 나타내는 말",
    ],
  },
  {
    id: "ten-commandments",
    title: "십계명",
    recommendedStyles: TEN_COMMANDMENTS_STYLES,
    items: [
      "1. 하나님 외에 다른 신을 두지 말라", "2. 우상을 만들거나 섬기지 말라", "3. 하나님의 이름을 망령되게 부르지 말라",
      "4. 안식일을 기억하여 거룩하게 지키라", "5. 부모를 공경하라", "6. 살인하지 말라", "7. 간음하지 말라",
      "8. 도둑질하지 말라", "9. 거짓 증언하지 말라", "10. 이웃의 소유를 탐내지 말라",
    ],
  },
];

export function getMemoryTopic(topicId: string): MemoryTopic | null {
  return MEMORY_TOPICS.find((topic) => topic.id === topicId) ?? null;
}

export function isMemoryStyle(value: string): value is MemorySongStyle {
  return (MEMORY_STYLES as readonly string[]).includes(value);
}

export function orderedStyles(topic: MemoryTopic | null): MemorySongStyle[] {
  if (!topic) return [...MEMORY_STYLES];
  return [
    ...topic.recommendedStyles,
    ...MEMORY_STYLES.filter((style) => !topic.recommendedStyles.includes(style)),
  ];
}

const STYLE_MUSIC: Record<MemorySongStyle, { key: string; bpm: number; chords: ChordResult["sections"]; english: string; korean: string }> = {
  "밝은 팝": {
    key: "C major", bpm: 112,
    chords: { intro: ["C", "G", "Am", "F"], verse: ["C", "G", "Am", "F"], chorus: ["F", "G", "C", "Am"], bridge: ["Dm", "Am", "F", "G"], outro: ["C", "G", "F", "C"] },
    english: "Bright educational pop at 112 BPM with clean drums, bouncy bass, acoustic guitar, light synths, clear group vocals, a highly repeatable chorus, and a short confident ending.",
    korean: "112 BPM의 밝은 교육형 팝으로, 또렷한 드럼과 통통 튀는 베이스, 어쿠스틱 기타, 가벼운 신스, 선명한 그룹 보컬과 반복하기 쉬운 후렴을 사용합니다.",
  },
  "쉬운 랩": {
    key: "A minor", bpm: 94,
    chords: { intro: ["Am", "F"], verse: ["Am", "F", "C", "G"], chorus: ["F", "G", "Am", "Am"], bridge: ["Dm", "F", "Am", "G"], outro: ["Am", "F", "Am"] },
    english: "Easy educational rap at 94 BPM with crisp kick and snare, simple bass, sparse piano stabs, clearly articulated Korean rap, call-and-response hooks, and steady phrasing that keeps every fact understandable.",
    korean: "94 BPM의 쉬운 교육형 랩으로, 선명한 킥과 스네어, 단순한 베이스, 간결한 피아노, 또박또박한 랩과 주고받는 후렴을 사용합니다.",
  },
  "동요 느낌": {
    key: "G major", bpm: 104,
    chords: { intro: ["G", "D"], verse: ["G", "D", "Em", "C"], chorus: ["C", "D", "G", "Em"], bridge: ["Am", "D", "G", "C"], outro: ["G", "D", "G"] },
    english: "Friendly sing-along tune at 104 BPM with piano, ukulele, handclaps, light percussion, warm unison vocals, simple melodic phrases, and a memorable chorus without sounding overly childish.",
    korean: "지나치게 유아적이지 않은 104 BPM의 친근한 합창곡으로, 피아노와 우쿨렐레, 손뼉, 가벼운 타악기, 따뜻한 유니슨 보컬을 사용합니다.",
  },
  "K-pop": {
    key: "D major", bpm: 118,
    chords: { intro: ["D", "A", "Bm", "G"], verse: ["Bm", "G", "D", "A"], chorus: ["G", "A", "D", "Bm"], bridge: ["Em", "Bm", "G", "A"], outro: ["D", "A", "G", "D"] },
    english: "Polished educational K-pop at 118 BPM with punchy drums, glossy synths, rhythmic bass, alternating lead and group vocals, a rising pre-chorus, and a catchy chant-like chorus built for memorization.",
    korean: "118 BPM의 세련된 교육형 K-pop으로, 힘 있는 드럼과 반짝이는 신스, 리드 보컬과 그룹 보컬의 교대, 상승하는 전개와 구호형 후렴을 사용합니다.",
  },
  "EDM": {
    key: "E minor", bpm: 126,
    chords: { intro: ["Em", "C"], verse: ["Em", "C", "G", "D"], chorus: ["C", "D", "Em", "G"], bridge: ["Am", "C", "Em", "D"], outro: ["Em", "C", "Em"] },
    english: "Energetic educational EDM at 126 BPM with a four-on-the-floor beat, pulsing synth bass, bright plucks, clear spoken-sung vocals, a short build, and a drop that repeats the core sequence without obscuring the words.",
    korean: "126 BPM의 에너지 있는 교육형 EDM으로, 포온더플로어 비트와 신스 베이스, 밝은 플럭, 또렷한 말하듯 부르는 보컬, 핵심 순서를 반복하는 드롭을 사용합니다.",
  },
  "어쿠스틱": {
    key: "G major", bpm: 92,
    chords: { intro: ["G", "C"], verse: ["G", "D", "Em", "C"], chorus: ["C", "D", "G", "Em"], bridge: ["Am", "Em", "C", "D"], outro: ["G", "C", "G"] },
    english: "Warm educational acoustic pop at 92 BPM with strummed guitar, soft piano, light cajon, intimate clear vocals, gentle harmonies, and a relaxed chorus that repeats the learning sequence naturally.",
    korean: "92 BPM의 따뜻한 교육형 어쿠스틱 팝으로, 스트럼 기타와 부드러운 피아노, 가벼운 카혼, 친밀하고 선명한 보컬과 자연스러운 반복 후렴을 사용합니다.",
  },
  "힙합": {
    key: "F minor", bpm: 88,
    chords: { intro: ["Fm", "Db"], verse: ["Fm", "Db", "Ab", "Eb"], chorus: ["Db", "Eb", "Fm", "Fm"], bridge: ["Bbm", "Db", "Fm", "Eb"], outro: ["Fm", "Db", "Fm"] },
    english: "Confident educational hip-hop at 88 BPM with a deep kick, tight snare, warm sub bass, restrained keys, precise rhythmic Korean vocals, layered response chants, and a strong chorus that reinforces the exact order.",
    korean: "88 BPM의 자신감 있는 교육형 힙합으로, 깊은 킥과 단단한 스네어, 따뜻한 서브베이스, 절제된 건반, 정확한 리듬 보컬과 응답형 구호를 사용합니다.",
  },
  "발라드": {
    key: "C major", bpm: 72,
    chords: { intro: ["C", "G/B"], verse: ["C", "G/B", "Am", "F"], chorus: ["F", "G", "Em", "Am"], bridge: ["Dm", "Am", "F", "G"], outro: ["C", "F", "C"] },
    english: "Clear educational ballad at 72 BPM with piano, soft strings, restrained percussion, sincere vocals, gradual dynamics, and a memorable chorus that repeats the key sequence while keeping every word intelligible.",
    korean: "72 BPM의 또렷한 교육형 발라드로, 피아노와 부드러운 스트링, 절제된 타악기, 진솔한 보컬과 모든 단어가 들리는 반복 후렴을 사용합니다.",
  },
};

function mockLyrics(topic: MemoryTopic, alternate: boolean): string {
  const first = topic.items.slice(0, Math.min(6, topic.items.length));
  const middle = Math.max(1, Math.ceil(topic.items.length / 2));
  const verseOne = topic.items.slice(0, middle);
  const verseTwo = topic.items.slice(middle);
  const intro = alternate ? `${topic.title}, 천천히 박자에 맞춰` : `${topic.title}, 순서대로 시작해`;
  const hook = first.join(" / ");
  return [
    "[Intro]", intro,
    "[Verse]", ...verseOne,
    "[Chorus]", hook, "앞에서부터 순서대로 한 번 더", hook,
    "[Verse]", ...verseTwo,
    "[Bridge]", "빠뜨리지 말고 처음부터 끝까지 연결해",
    "[Chorus]", ...topic.items,
    "[Outro]", `${topic.title}, 순서대로 기억 완료`,
  ].join("\n");
}

export function createMemoryMockResult(topic: MemoryTopic, style: MemorySongStyle): GenerationResult {
  const preset = STYLE_MUSIC[style];
  return {
    chords: { key: preset.key, bpm: preset.bpm, timeSignature: "4/4", sections: preset.chords },
    sunoStyle: preset.english,
    sunoStyleKorean: preset.korean,
    lyrics: { a: mockLyrics(topic, false), b: mockLyrics(topic, true) },
    titles: [`${topic.title} 한 곡 완성`, `${topic.title} 순서송`, `한 번에 외우는 ${topic.title}`],
    titlesEnglish: ["Learn It in One Song", "The Memory Order Song", "Memorize It in One Go"],
    hashtags: ["#암기송", "#공부음악", "#교육음악", "#기억법", "#학습", "#공부", "#Suno", "#YouTubeMusic"],
  };
}
