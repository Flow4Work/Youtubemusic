# Youtubemusic

가수와 대표곡을 선택하면 다음 창작 자료를 한 번에 만드는 Next.js 웹서비스입니다.

- 창작용 코드 진행
- Suno 스타일 프롬프트
- 가사 A안, B안
- 제목 후보 3개와 해시태그 8개

## 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

API Key가 없어도 Mock 결과로 전체 기능을 확인할 수 있습니다.

## AI fallback

1. `GLM_API_KEY`가 있으면 GLM 우선 호출
2. GLM 실패 시 `GROQ_API_KEY`로 Groq 호출
3. 두 API가 없거나 모두 실패하면 Mock 결과 표시

모든 API 호출은 `src/app/api/generate/route.ts`에서만 실행하며 키를 클라이언트에 전달하지 않습니다.

## 가수 데이터 추가

`data/artists/` 아래에 가수 한 명당 JSON 파일 하나를 추가하고 `data/artists/index.ts`에 import를 등록합니다.

필수 검수 원칙:

- 곡명, Key, BPM, 구간별 코드 확인
- 실제 출처 URL과 라이선스 기록
- 불명확하면 `verified: false`
- LLM이 추정한 코드를 원곡 코드처럼 저장하지 않기

현재 포함된 20명은 기능 검증을 위해 직접 만든 **가상 데모 아티스트와 CC0 코드 데이터**입니다. 실제 가수 데이터가 아니며 화면에서도 데모로 표시됩니다.

## 저장

최근 생성 결과는 브라우저 `localStorage`에 최대 20개만 저장합니다. DB와 로그인은 사용하지 않습니다.

## 구현 범위

- 전체 결과 1회 생성과 항목별 재생성
- 코드 반음 이동과 쉬운 코드 변환
- 가사 A안, B안 선택
- 최근 결과 최대 20개 저장, 불러오기, 삭제
- GLM → Groq → Mock fallback
- 데스크톱 4열, 태블릿 2열, 모바일 단계형 레이아웃

## 검증

```bash
npm run lint
npm run build
```

GitHub Actions에서도 동일한 검증을 수행합니다.
