import type { GenerationResult, Song } from "@/lib/types";

const lyricA = `창가에 번진 늦은 햇살
오늘도 마음을 천천히 열어
서툰 하루를 접어 둔 채
한 걸음 먼저 너에게 갈게
조금 느려도 괜찮다고
우리의 박자는 여기 있다고
말없이 건넨 작은 미소가
긴 밤의 끝을 밝혀 주었지

다시 시작되는 오늘
작은 목소리도 노래가 되고
흔들린 시간 끝에서
나는 너와 같은 꿈을 부를게
멀리 돌아온 마음까지
이제는 따뜻하게 안아 줄게

익숙한 골목 끝의 바람
잊었던 웃음을 다시 데려와
멈춰 있던 시계의 초침도
우리 발걸음 따라 움직여
지나간 후회가 떠올라도
그 안에 머물지는 않을 거야
네가 내 이름을 불러 주면
새로운 계절이 문을 열어

다시 시작되는 오늘
작은 용기도 빛이 되어
아직 모르는 내일 앞에서
우리는 서로의 길이 될 거야
어둠이 오래 머문 자리엔
더 환한 노래가 피어날 테니
마지막 한 걸음까지
너와 함께 천천히 걸어갈게`;

const lyricB = `불 꺼진 거리 위로 내려온
푸른 새벽이 어깨를 감싸면
말하지 못한 많은 장면이
조용히 별처럼 떠오르네
끝이라고 믿었던 순간
새로운 문이 열리고 있어

너의 계절을 따라 걸어
서로 다른 내일도 함께 그려
눈물이 지나간 자리엔
더 환한 우리 노래가 남아

멀리 돌아온 마음 하나
이제는 숨기지 않아도 돼
작은 손을 다시 맞잡으면
긴 밤도 결국 아침이 되니까

너의 계절을 따라 걸어
흔들리는 날에도 곁에 있어
우리의 시간이 멈추지 않게
오늘보다 조금 더 사랑할게`;

export function createMockResult(song: Song): GenerationResult {
  const baseSections = Object.fromEntries(
    Object.entries(song.sections).map(([name, chords]) => [name, [...chords]]),
  );
  const bpm = song.bpm ?? 88;

  return {
    chords: {
      key: song.key ?? "C major",
      bpm: Math.min(180, Math.max(55, bpm + 4)),
      timeSignature: song.timeSignature ?? "4/4",
      sections: {
        ...baseSections,
        bridge: baseSections.bridge?.length ? baseSections.bridge : ["Am7", "Em7", "Fmaj7", "G"],
      },
    },
    sunoStyle:
      "Warm Korean pop ballad with clear acoustic guitar, soft piano, an intimate mid-low register vocal, a steady tempo around 92 BPM, restrained verses that gradually expand with drums and strings in the chorus, a memorable singable melody, sincere and hopeful emotion, no rap, no excessive high notes, and no imitation of any existing melody or singer.",
    sunoStyleKorean:
      "선명한 어쿠스틱 기타와 부드러운 피아노가 중심인 따뜻한 한국 팝 발라드입니다. 중저음의 친밀한 보컬로 시작해 후렴에서 드럼과 스트링이 자연스럽게 확장되며, 따라 부르기 쉬운 멜로디와 진솔하고 희망적인 감정을 강조합니다. 랩과 과도한 고음, 기존 멜로디나 가수의 모방은 제외합니다.",
    lyrics: { a: lyricA, b: lyricB },
    titles: ["다시 시작되는 오늘", "너의 계절을 따라", "별이 된 마음"],
    titlesEnglish: ["A New Beginning Today", "Following Your Season", "A Heart Turned Into a Star"],
    hashtags: ["#신곡", "#감성발라드", "#한국어노래", "#SunoAI", "#작곡", "#힐링음악", "#노래만들기", "#유튜브뮤직"],
  };
}
