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

개발 환경에서 `GROQ_API_KEY`가 없을 때만 Mock 결과를 사용합니다. 프로덕션에서는 API Key가 없거나 모든 모델 호출이 실패하면 오류를 표시합니다.

## AI fallback

1. `GROQ_PRIMARY_MODEL` (`openai/gpt-oss-120b`)
2. `GROQ_FALLBACK_MODEL` (`openai/gpt-oss-20b`)
3. `GROQ_SECONDARY_MODEL` (`llama-3.3-70b-versatile`)
4. 세 모델이 모두 실패하면 오류 표시

모든 API 호출은 `src/app/api/generate/route.ts`에서만 실행하며 키를 클라이언트에 전달하지 않습니다.

## 가수 데이터 추가

실제 가수 JSON은 `data/artists/real/`에 가수 한 명당 파일 하나씩 추가합니다. 이 폴더에 JSON이 하나라도 있으면 기존 데모 데이터 대신 실제 JSON만 자동으로 로딩합니다.

- 별도 import 등록 불필요
- 빈 코드 구간 허용
- `verified: false` 허용
- 실제 출처와 라이선스 정보 유지
- LLM이 추정한 코드를 원곡 코드처럼 저장하지 않기

현재 `data/artists/` 루트의 20개 JSON은 기능 검증용 가상 데모 데이터입니다.

## 저장

최근 생성 결과는 브라우저 `localStorage`에 최대 20개만 저장합니다. DB와 로그인은 사용하지 않습니다.

## 구현 범위

- 전체 결과 1회 생성과 항목별 재생성
- 코드 반음 이동과 쉬운 코드 변환
- 가사 A안, B안 선택
- 최근 결과 최대 20개 저장, 불러오기, 삭제
- Groq 120b → 20b → Llama 순차 fallback
- 데스크톱 4열, 태블릿 2열, 모바일 단계형 레이아웃

## 검증

```bash
npm run lint
npm run build
```

GitHub Actions에서도 동일한 검증을 수행합니다.
