# BCSD Internal

Vite + React + TanStack Router 기반 관리 화면. 서버 데이터는 TanStack Query로 관리한다.

## 개발

Node.js 24, pnpm 10.33.0을 사용한다.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

개발 주소는 http://localhost:3000 이다. `.env`의 `API_ORIGIN`을 접근 가능한 백엔드 주소로 설정한다. 브라우저는 `/v1/*`로 요청하고 Vite가 개발 중에만 프록시한다.

## 폴더 구조 (FSD)

```text
src/
  app/        # 라우트, Router, Provider, 앱 초기화, 전역 스타일
  pages/      # 화면별 슬라이스 (members, games, tracks, finance 등)
  widgets/    # 관리 레이아웃, 장부·회비 화면 블록, 에디터
  features/   # 이미지 업로드, 부원 선택, 세션 가드
  entities/   # 도메인 API, Query 옵션, 모델 (member, session, finance 등)
  shared/     # HTTP 클라이언트, 공통 UI, 범용 유틸·hooks
  main.tsx    # React 진입점
```

의존성은 `app → pages → widgets → features → entities → shared` 방향이다. 슬라이스 밖에서는 `index.ts` 공개 API만 사용하고 내부에서는 상대 경로를 사용한다. 엔티티 간 참조는 `@x/<소비자>`로 명시한다. `pnpm check:fsd`로 경계를 검사한다.

장부와 회비는 서로 연결된 모델·API·mock 상태를 공유하므로 `entities/finance` 안에 함께 둔다. 화면에서만 사용하는 구성 요소는 페이지 슬라이스 안에 두고, 여러 화면에서 재사용하는 사용자 상호작용만 features로 추출한다.

라우트 변경 후 `pnpm routes:generate`를 실행하고 `src/app/router/routeTree.gen.ts`를 함께 커밋한다. 이 파일은 직접 수정하지 않는다.

## 검증

```sh
pnpm typecheck
pnpm check:fsd
pnpm lint
pnpm format:check
pnpm build
pnpm exec playwright install chromium
pnpm test
```

Playwright는 빌드된 `dist/`를 3100번 포트의 Vite preview로 실행하고 API를 mock한다. 시각 테스트 기준 이미지는 Windows용이다. `pnpm test:visual`로 전체 테스트를 실행하면 다른 플랫폼에서는 해당 기준 이미지 부재로 시각 검사가 실패할 수 있다. CI에서는 동작 및 라우팅 테스트를 실행한다. `pnpm start`는 로컬 빌드 확인용이다.

## 환경변수

`.env.example` 참고. `VITE_*`는 공개되는 빌드 시점 값이며 비밀값을 넣지 않는다. 배포 후 변경하려면 재빌드해야 한다.

- `VITE_HOMEPAGE_URL`: 홈페이지 링크. 기본 `https://bcsdlab.com`.
- `VITE_LEDGER_API=mock`: 로컬 장부·회비 mock. 기본 live.
- `VITE_DUES_NOTIFICATION_API=live`: 실제 회비 알림 발송. 기본 mock 유지.
- `VITE_LEDGER_PREVIEW=true`: 개발 모드의 로그인 없는 장부 미리보기. `VITE_LEDGER_API=mock`과 함께 사용.
- `API_ORIGIN`: 브라우저에 공개하지 않는 프록시 대상. 개발은 `.env`, 운영은 컨테이너 환경변수. origin만 지정하고 경로·끝 슬래시는 붙이지 않는다.

## 운영 배포

`main` push → 검증 → arm64 Docker 이미지 → GHCR → SSH 배포. 운영 이미지에는 Nginx와 `dist/`만 들어가며 Node.js는 실행하지 않는다.

```text
internal.bcsdlab.com (기존 호스트 Nginx/TLS)
  → 127.0.0.1:3000 (프런트 Nginx 컨테이너)
    → /v1/*: API_ORIGIN으로 프록시
    → /assets/*: 해시 자산 장기 캐시
    → 화면 주소: index.html 반환 후 브라우저 라우팅
```

GitHub Actions Secrets:

- `DEPLOY_HOST`: 운영 서버 주소
- `DEPLOY_PORT`: SSH 포트 (현재 22222)
- `DEPLOY_USER`: SSH 사용자 (현재 ubuntu)
- `DEPLOY_SSH_KEY`: 개인키 내용. 로컬 키 파일은 커밋하지 않는다.
- `API_ORIGIN`: 운영 API origin. 같은 Docker 네트워크의 기본값은 `http://bcsd-internal-api:8081`.

기존 Docker 네트워크 `bcsdlab-internal_default`와 호스트 포트 `127.0.0.1:3000`을 유지하므로 호스트 Nginx·DNS·인증서 변경은 필요하지 않다. 컨테이너 시작 시 Nginx 템플릿에 `API_ORIGIN`만 치환한다.

이미지는 `latest`와 커밋 SHA로 태그하며 실제 배포는 SHA를 사용한다. 기존 컨테이너를 중지·이름 변경한 뒤 새 컨테이너를 실행하므로 짧은 중단이 있다. 새 컨테이너 health check나 화면 직접 접속 검사가 실패하면 이전 컨테이너를 복원한다. 성공한 뒤 이전 컨테이너를 삭제한다. 수동 롤백은 이전 SHA 이미지와 동일한 포트·네트워크·환경변수로 실행한다.

컨테이너 검증 및 실행 예시:

```sh
docker build -t bcsd-internal-frontend:local .
python3 scripts/verify-nginx.py bcsd-internal-frontend:local
docker run --rm --network bcsdlab-internal_default \
  -p 127.0.0.1:3000:3000 \
  -e API_ORIGIN=http://bcsd-internal-api:8081 \
  bcsd-internal-frontend:local
```

`/healthz`는 정적 서버 생존만 검사한다. 실제 배포 후 로그인, 쿠키를 통한 새로고침 세션 복원, API 호출, 상세 URL 직접 진입을 별도로 확인한다.

## 코드 품질 검사

KOIN_WEB_RECODE의 규칙을 참고해 기존 Oxlint·Oxfmt에 import 그룹 정렬, 타입 import,
중복 import 검사와 TanStack Query 검사를 적용한다. 경고도 CI 실패로 처리한다.
SCSS/BEM과 Next.js 전용 규칙은 이 프로젝트에 적용하지 않는다.

- `pnpm lint:fix`: 린트 자동 수정
- `pnpm format`: 포맷 및 import 정렬
- `pnpm test:tooling`: FSD import 분석기의 회귀 테스트
- `pnpm check:fsd`: 레이어·슬라이스 public API 검사 (동적 import 및 타입 import 포함)

`pnpm install` 시 Husky를 설치하며, 커밋 전에 lint-staged가 변경 파일의 포맷·린트를
수정하고 FSD 경계를 검사한다. `.editorconfig`로 들여쓰기와 줄바꿈을 통일한다.
