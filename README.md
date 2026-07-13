# ResearchOS

개인 연구 관리 대시보드. 연구 진도(간트), 아이디어, 논문 리뷰, 링크 저장, 일정/계획, 컨디션·루틴, 행정문서(연구비/출장/제안서)를 하나의 앱에서 관리합니다.

- **스택**: Next.js 15 (App Router) 단일 풀스택 · TypeScript · Tailwind CSS v4 · Prisma 6 · PostgreSQL · Recharts
- **테마**: 인디고-바이올렛, 접이식 사이드바, 데스크톱/모바일 반응형
- **인증**: 단일 사용자 (환경변수 비밀번호 → JWT 세션 쿠키, 30일)

## 탭 구성

| 탭 | 기능 |
|---|---|
| 대시보드 | 통계 카드, 태스크 도넛, 프로젝트 진행률, 컨디션 추이, 활동 그래프, 마감 피드 |
| 연구 | 프로젝트/태스크/마일스톤 CRUD, 연간 간트 차트, 연구 기록(수동+동기화) |
| 아이디어 | 상태별 보드(탐색중/보류/승격/폐기), 프로젝트 승격 |
| 논문 | 리뷰·분류·평점·읽기상태, 검색/필터, Markdown 요약 |
| 라이브러리 | 링크/스니펫 저장, 고정, 분류·태그 필터 |
| 플래너 | 주간/월간 캘린더, 할일/일정, 우선순위·진행률, 반복 일정 |
| 루틴 | 컨디션 기록(기분/에너지/수면), 14일 추이, 습관 트래커+스트릭 |
| 문서 | 월간 연구비 영수증 대장(고정지출 자동 반영, 인쇄), 출장 보고서, 제안서 정보 |
| 설정 | 동기화 API 토큰 발급, JSON 백업 내보내기 |

## 로컬 개발

```bash
npm install
cp .env.example .env   # DATABASE_URL, OWNER_PASSWORD, AUTH_SECRET 설정
npx prisma migrate dev
npx prisma db seed     # 한국어 샘플 데이터
npm run dev
```

`.env`의 `OWNER_PASSWORD`로 로그인합니다.

## 배포 (Vercel + Neon)

1. [Neon](https://neon.tech)에서 무료 Postgres 프로젝트 생성 → **pooled** 연결 문자열을 `DATABASE_URL`, **direct** 연결 문자열을 `DIRECT_URL`로 사용
2. Vercel에서 이 저장소 import → 환경변수 4개 설정:
   - `DATABASE_URL`, `DIRECT_URL`
   - `OWNER_PASSWORD` (로그인 비밀번호)
   - `AUTH_SECRET` (32자 이상 랜덤 문자열, `openssl rand -hex 32`)
3. Build Command를 `npm run vercel-build`로 지정 (마이그레이션 자동 적용)
4. 배포 후 `/login`에서 로그인 → 설정 탭에서 sync 토큰 발급

## 로컬 PC 동기화

연구 PC의 일일보고서 폴더(`Daily_Report_YYYY-MM-DD.md`)를 스캔해 업로드합니다.

```jsonc
// scripts/sync.config.json (gitignore 됨)
{
  "reportsDir": "C:\\Research\\07_reports",
  "apiUrl": "https://your-app.vercel.app",
  "apiToken": "ros_..."   // 설정 탭에서 발급
}
```

```bash
node scripts/sync-reports.mjs            # 변경분만 업로드
node scripts/sync-reports.mjs --dry-run  # 미리보기
node scripts/sync-reports.mjs --all      # 전체 재업로드
```

- 파일 해시 기반 로컬 스킵 + 서버측 dedup으로 몇 번을 재실행해도 안전합니다.
- 첫 `# 제목` 줄이 기록 제목이 되고, 없으면 `Daily Report <날짜>`로 저장됩니다.
- Windows 작업 스케줄러에 `node <repo>\scripts\sync-reports.mjs`를 등록하면 자동 동기화됩니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `start` | 프로덕션 빌드/실행 |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma 마이그레이션 (dev) |
| `npm run db:seed` | 샘플 데이터 시드 |
