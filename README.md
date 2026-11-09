# Microsserv52 admin

**Application stack**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-B59B00?style=flat&logo=javascript&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-663399?style=flat&logo=css&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![React](https://img.shields.io/badge/React-149ECA?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![React Compiler](https://img.shields.io/badge/React_Compiler-149ECA?style=flat&logo=react&logoColor=white)](https://react.dev/learn/react-compiler)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![MUI](https://img.shields.io/badge/MUI-007FFF?style=flat&logo=mui&logoColor=white)](https://mui.com/)
[![Emotion](https://img.shields.io/badge/Emotion-D26AC2?style=flat)](https://emotion.sh/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-EF4444?style=flat&logo=reactquery&logoColor=white)](https://tanstack.com/query/latest)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white)](https://zod.dev/)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat&logo=reacthookform&logoColor=white)](https://react-hook-form.com/)
[![TanStack Table](https://img.shields.io/badge/TanStack_Table-EF4444?style=flat)](https://tanstack.com/table/latest)

**Build, checks and delivery**

[![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-CB3837?style=flat&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-6A587C?style=flat&logo=prettier&logoColor=white)](https://prettier.io/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat)](https://playwright.dev/)
[![pre-commit](https://img.shields.io/badge/pre--commit-FAB040?style=flat&logo=precommit&logoColor=white)](https://pre-commit.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)](https://git-scm.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![GHCR](https://img.shields.io/badge/GHCR-181717?style=flat&logo=github&logoColor=white)](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
[![CodeQL](https://img.shields.io/badge/CodeQL-181717?style=flat&logo=github&logoColor=white)](https://codeql.github.com/)

**Browser observability; disabled by default**

[![Grafana Faro](https://img.shields.io/badge/Grafana_Faro-F46800?style=flat&logo=grafana&logoColor=white)](https://grafana.com/oss/faro/)
[![Umami](https://img.shields.io/badge/Umami-000000?style=flat&logo=umami&logoColor=white)](https://umami.is/)

English-language educational mock store frontend at `/admin/`. **No real
payments or transactions take place, and no goods are shipped.**

This independent repository is integrated at `platform/web/admin` as a Git
submodule. It uses Next.js App Router, TypeScript, MUI with Emotion, Tailwind,
TanStack Query, runtime validation and configurable Grafana Faro/Umami.
Admin additionally uses TanStack Table; store/admin use React Hook Form.

## Local development

Use Node.js 24 and npm. Copy `.env.example` to `.env.local` if local values are
needed; never commit credentials.

```bash
npm ci
npm run dev
```

The application has a fixed build-time base path `/admin/`. Run the platform
Compose environment for same-origin API/cookie testing. A standalone dev server
needs an explicitly configured API origin/proxy; do not weaken CORS or save JWTs
in browser storage to make a development shortcut work.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
pre-commit run --all-files
```

Browser tests use labeled API fixtures and a local static test server. CI installs
Chromium before running them. For a running platform preview set
`PLAYWRIGHT_BASE_URL`. The tests validate UI contracts, not live backend behavior.

## Static output and containers

`npm run build` exports the site to `out/`. It requires no Next.js server,
server actions, BFF, or database connection at runtime. Detail screens use query
IDs because arbitrary runtime IDs cannot be pre-generated by static export.

The Dockerfile uses the official Node build image and serves the export with
Nginx. The platform Compose proxy reserves each zone's prefix and routes `/api/`
to Gateway. The frontend Kubernetes deployment is deferred. CDN provider,
production origins and environment values must be discussed with the owner
before deployment.

All `NEXT_PUBLIC_*` values are public, compiled at build time and require a new
build when changed. Set API URL, display timezone, app environment/version and
telemetry values using `.env.example`. Telemetry defaults to disabled until
hosting and policy are agreed. No secret belongs in a public variable.

## Authentication and privacy

Gateway owns the HttpOnly `ms52-session` cookie and browser session endpoints.
Mutations obtain a CSRF token first. Gateway and services enforce access;
frontend route guards only control presentation. Expired sessions require login.
Only cart product IDs/quantities and UI preferences are stored on the device.
The store PWA is online-only; no service worker caches private data or replays
orders. Every checkout is explicitly labeled as a demo.

## Design and integration documentation

The approved defaults and visual references live in the platform
[design direction](https://github.com/Microsserv52/platform/blob/feature/frontend-applications/docs/frontend/design.md).
See the platform [frontend documentation](https://github.com/Microsserv52/platform/blob/feature/frontend-applications/docs/frontend/index.md)
for routing, feature scope, package decisions, API prerequisites, local fixture
mode and verification evidence. antislop is applied during implementation.

Source was initialized with official `create-next-app@16.4.5`; browser testing
was initialized with official `create-playwright@1.17.139`. Each repository owns
its npm lockfile, checks, immutable image workflow and source history. CodeQL
on private repositories requires the organization's corresponding GitHub
security entitlement. CI configuration is included; remote workflow results
are not claimed until the branches are pushed and checks have run.
