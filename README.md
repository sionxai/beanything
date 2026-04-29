# Be Anything

하고 싶은 일을 현실적인 경로와 첫 결과물 실험으로 바꾸는 정적 웹 MVP입니다. 프레임워크 없이 동작하는 반응형 SPA이며, 온보딩부터 추천 해설, 7일/30일/90일/첫 수익 실행판까지 한 흐름으로 구성했습니다.

## 포함한 범위

- 꿈 자유 입력, 현재 상황, 끌리는 장면, 일하는 방식, 막힌 지점 입력
- 180개 커리어/프로젝트 경로 추천
- 꿈과의 거리, 현재 조건, 흥미/작업 방식, 체크인 반응 기반 해설
- 부정 체크인 시 보류/비추천 신호 표시
- 7일, 30일, 90일, 첫 수익/첫 피드백 실행판
- 학생 상태 전용 프로젝트 모드
- 이미지 카드 UI, PWA 메타, 로컬 저장, 오프라인 캐시

## 실행 방법

정적 서버로 실행하면 됩니다.

```bash
python3 -m http.server 4177
```

브라우저에서 [http://localhost:4177](http://localhost:4177) 를 열면 됩니다.

## 배포

정적 사이트로 배포합니다.

- Build command: 비워둠
- Publish directory: `.`
- Vercel: `vercel.json` 포함
- Netlify: `netlify.toml` 포함

## 구조

- `index.html`
- `styles.css`
- `src/app.js`
- `src/data/sample-data.js`
- `src/data/questions.js`
- `src/lib/engine.js`
- `src/lib/storage.js`
- `assets/`
- `tests/`

## 문서 반영 방식

- 제공된 설계문서의 MVP 플로우를 화면 단위로 반영했습니다.
- 제공된 샘플 시드 JSON을 확장해 180개 경로와 장기 실행 단계를 구성했습니다.
- 제공된 Supabase 스키마는 이후 연결을 위해 `supabase/` 폴더에 정리했습니다.

## 다음 연결 포인트

- `src/lib/storage.js`를 Supabase client 기반 데이터 어댑터로 교체
- `src/lib/engine.js`의 탐색 요약과 추천 설명을 실제 LLM 호출로 교체
- 인증 추가 후 `user_profiles`, `assessment_sessions`, `career_recommendations`, `user_sprints` 등에 저장
