# Project conventions

- Vite + React SPA with TanStack Router file-based routes in `src/app/routes`.
- Follow FSD dependency direction: `app → pages → widgets → features → entities → shared`.
- Keep route definitions thin. Page slices live in `src/pages`; reusable interactions in `src/features`; composed UI in `src/widgets`.
- Import other slices through their `index.ts` public API. Internal imports use relative paths. Entity cross-references use explicit `@x/<consumer>` APIs.
- Keep `shared` independent of domain entities. Connect HTTP authentication to session state in `app/providers/api-auth.ts`.
- Run `pnpm routes:generate` after changing routes. Commit `src/app/router/routeTree.gen.ts`; do not edit it manually.
- Keep API calls under `/v1` relative to the app origin. Development uses Vite proxy; production uses the container Nginx proxy.
- `VITE_*` variables are public build-time values. `API_ORIGIN` is server-only.
- Before shipping, run typecheck, FSD boundary checks, lint, format checks, build, and Playwright tests.
