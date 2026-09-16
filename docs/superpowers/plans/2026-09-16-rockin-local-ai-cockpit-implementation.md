# RockIn Local AI Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, public, local-first Ollama cockpit with chat, model discovery, hardware telemetry, a bounded 3D topology view, demo mode, and professional open-source packaging.

**Architecture:** TypeScript monorepo with a React/Vite frontend, Fastify loopback-only backend, Zod shared contracts, and pure shared utilities. The browser talks only to the local server; the server talks to Ollama and local OS telemetry. Demo mode is deterministic and requires no Ollama.

**Tech Stack:** Node.js 22+, npm workspaces, React 19.3.0, Vite 8.3.0, TypeScript 7.0.2, Fastify 5.12.4, Zod 4.6.5, systeminformation 5.33.10, Three.js 0.186.0, Vitest 5.0.1, Playwright 1.63.0, ESLint 10.10.0, Prettier 3.9.6.

**Spec:** `docs/superpowers/specs/2026-09-16-rockin-local-ai-cockpit-design.md`

## Global Constraints
- New clean-room project only; no private RockIn source, secrets, paths, databases, or logs.
- Core operation requires no cloud account, API key, or telemetry.
- Server binds to `127.0.0.1` by default and rejects unsafe non-loopback binds.
- No request may expose environment variables or local filesystem paths to the browser.
- Demo mode must work without Ollama.
- Public v0.1 targets Windows first while keeping portable APIs for Linux/macOS follow-up.
- All code changes follow RED → GREEN → refactor with focused commits.
- Public release is blocked until full tests, security audit, license audit, secret scan, clean-room scan, and production build pass.

---
### Task 1: Workspace foundation and contracts

**Files:** Create `package.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `packages/contracts/package.json`, `packages/contracts/src/index.ts`, `packages/contracts/src/index.test.ts`.

**Interfaces:** Produce `HealthSnapshot`, `ModelSummary`, `HardwareSnapshot`, `GraphSnapshot`, `ChatRequest`, `ChatResponse`, and Zod schemas exported from `@rockin/contracts`.

- [ ] **Step 1: Write failing contract tests** that parse one valid payload and reject malformed model/chat payloads.
- [ ] **Step 2: Run** `npm test --workspace @rockin/contracts` and verify failure because contracts do not exist.
- [ ] **Step 3: Implement minimal Zod contracts** with explicit bounded string/array sizes and no `unknown` passthrough fields.
- [ ] **Step 4: Run contract tests, root typecheck, ESLint, and Prettier check**; all must pass.
- [ ] **Step 5: Commit** `chore: establish typed workspace contracts`.

### Task 2: Secure local server foundation

**Files:** Create `apps/server/package.json`, `apps/server/src/config.ts`, `apps/server/src/server.ts`, `apps/server/src/routes/health.ts`, `apps/server/test/config.test.ts`, `apps/server/test/health.test.ts`.

**Interfaces:** `loadConfig(env): ServerConfig`, `buildServer(deps): FastifyInstance`; health endpoint `GET /api/v1/health` returns `HealthSnapshot`.

- [ ] **Step 1: Write tests** proving default host is `127.0.0.1`, non-loopback host is rejected, oversized JSON is rejected, and `/api/v1/health` never returns filesystem/environment data.
- [ ] **Step 2: Run server tests and verify RED.**
- [ ] **Step 3: Implement Fastify server** with body limit, loopback bind validation, strict CORS/origin handling, security headers, structured local error codes, and no request logging of prompt bodies.
- [ ] **Step 4: Run tests and a real loopback smoke** using an ephemeral port.
- [ ] **Step 5: Commit** `feat(server): add loopback-only secure API foundation`.
### Task 3: Ollama discovery, models, and chat adapter

**Files:** Create `apps/server/src/ollama/client.ts`, `apps/server/src/routes/models.ts`, `apps/server/src/routes/chat.ts`, `apps/server/test/ollama.test.ts`, `apps/server/test/chat.test.ts`.

**Interfaces:** `OllamaClient.listModels(): Promise<ModelSummary[]>`; `OllamaClient.chat(request: ChatRequest): Promise<ChatResponse>`; endpoints `GET /api/v1/models`, `POST /api/v1/chat`.

- [ ] **Step 1: Build a fake Ollama HTTP server in tests** for `/api/tags` and `/api/chat`, including offline, timeout, malformed JSON, and success cases.
- [ ] **Step 2: Run adapter/route tests and verify RED.**
- [ ] **Step 3: Implement the adapter** with explicit timeout, local URL validation, response-size bounds, schema validation, deterministic error mapping, and no retry storm.
- [ ] **Step 4: Run tests plus a real optional smoke against `http://127.0.0.1:11434` when Ollama is available.**
- [ ] **Step 5: Commit** `feat(server): add safe Ollama model and chat adapter`.

### Task 4: Hardware telemetry and bounded graph snapshot

**Files:** Create `apps/server/src/hardware/service.ts`, `apps/server/src/graph/service.ts`, `apps/server/src/routes/system.ts`, `apps/server/src/routes/graph.ts`, matching unit tests.

**Interfaces:** `readHardware(): Promise<HardwareSnapshot>` and `buildGraph(input): GraphSnapshot`; endpoints `GET /api/v1/system`, `GET /api/v1/graph`.

- [ ] **Step 1: Write tests** for normalized CPU/RAM/GPU/VRAM fields, unknown-device fallbacks, bounded graph node/edge counts, stable IDs, and absence of local paths.
- [ ] **Step 2: Run tests and verify RED.**
- [ ] **Step 3: Implement `systeminformation` adapter** with a 2-second cache and a pure graph builder that emits only models, runtime, hardware, and capability nodes.
- [ ] **Step 4: Run tests and measure endpoint latency over 20 requests; cached requests must avoid repeated full hardware scans.**
- [ ] **Step 5: Commit** `feat(server): add hardware and topology snapshots`.
### Task 5: Web shell, dashboard, and deterministic demo mode

**Files:** Create `apps/web/package.json`, `apps/web/index.html`, `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/styles.css`, `apps/web/src/api/client.ts`, `apps/web/src/demo/fixtures.ts`, component tests.

**Interfaces:** `CockpitApi` exposes `health()`, `models()`, `system()`, `graph()`, `chat()`; demo adapter implements the same interface using deterministic fixtures.

- [ ] **Step 1: Write component tests** for loading, offline, demo, connected, and hardware states.
- [ ] **Step 2: Run web tests and verify RED.**
- [ ] **Step 3: Implement responsive cockpit shell** with connection banner, hardware cards, model summary, accessible navigation, and demo-mode toggle.
- [ ] **Step 4: Run tests, typecheck, production build, and keyboard/contrast spot checks.**
- [ ] **Step 5: Commit** `feat(web): add cockpit dashboard and demo mode`.

### Task 6: Local chat and model switching

**Files:** Create `apps/web/src/features/chat/ChatPanel.tsx`, `ModelSelect.tsx`, `chat-state.ts`, tests.

**Interfaces:** `sendMessage(model: string, message: string): Promise<ChatResponse>`; UI keeps ephemeral in-memory messages only.

- [ ] **Step 1: Write tests** for model selection, disabled send without model/message, success response, Ollama offline error, and no persistence after remount.
- [ ] **Step 2: Run tests and verify RED.**
- [ ] **Step 3: Implement accessible chat UI** with bounded message rendering and explicit local-only privacy copy.
- [ ] **Step 4: Run tests and fake-Ollama integration smoke.**
- [ ] **Step 5: Commit** `feat(web): add local model chat experience`.

### Task 7: Interactive 3D graph with graceful fallback

**Files:** Create `apps/web/src/features/graph/GraphPanel.tsx`, `three-renderer.ts`, `svg-fallback.ts`, tests.

**Interfaces:** renderer consumes only `GraphSnapshot`; `mountGraph(canvas, snapshot, options)` returns a disposer.

- [ ] **Step 1: Write tests** for bounded snapshot consumption, disposer cleanup, reduced-motion behavior, and fallback when WebGL is unavailable.
- [ ] **Step 2: Run tests and verify RED.**
- [ ] **Step 3: Implement Three.js renderer** with capped pixel ratio, deterministic layout seed, node focus, zoom-to-fit, cleanup, and SVG fallback.
- [ ] **Step 4: Run tests plus browser smoke with WebGL and forced fallback.**
- [ ] **Step 5: Commit** `feat(web): add accessible 3d topology view`.
### Task 8: End-to-end verification and production scripts

**Files:** Create `playwright.config.ts`, `tests/e2e/demo.spec.ts`, `tests/e2e/offline.spec.ts`, `scripts/verify.mjs`, `scripts/clean-room-scan.mjs`.

**Interfaces:** `npm run verify` is the single local release gate and exits non-zero on any failed stage.

- [ ] **Step 1: Write failing browser tests** for demo launch, offline Ollama state, responsive layout, reduced motion, and chat through a fake Ollama server.
- [ ] **Step 2: Run Playwright and verify RED.**
- [ ] **Step 3: Implement deterministic dev/test launch scripts and the release gate**: format check → lint → typecheck → unit/integration → build → browser smoke → `npm audit --audit-level=high` → clean-room scan.
- [ ] **Step 4: Run `npm run verify` twice from clean installs and compare results.**
- [ ] **Step 5: Commit** `test: add deterministic full release gate`.

### Task 9: Open-source documentation and GitHub community surface

**Files:** Create `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `ROADMAP.md`, `docs/architecture.md`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `.github/dependabot.yml`, `.github/workflows/ci.yml`.

**Interfaces:** CI runs the same `npm ci` + `npm run verify` contract as local verification on supported Node versions.

- [ ] **Step 1: Add a docs validation test** that checks required community files, README quickstart commands, license identifier, and SECURITY contact path.
- [ ] **Step 2: Verify the docs test fails before files exist.**
- [ ] **Step 3: Write concise project/community docs and minimal CI** with least-privilege permissions, npm cache, concurrency cancellation, and no paid/external actions beyond maintained official/community essentials after SHA pinning review.
- [ ] **Step 4: Run Markdown/link checks, license audit, and full `npm run verify`.**
- [ ] **Step 5: Commit** `docs: prepare public open source repository`.

### Task 10: Original Blender branding and public launch

**Files:** Create original assets under `assets/brand/` and `assets/demo/`; update README media references. No Blender source file is required in the public repo unless its size/license is appropriate.

- [ ] **Step 1: Generate original 1280×640 social preview, logo marks, and one hero still using Blender 5.2.2 LTS with OptiX; record render settings and asset license in `assets/brand/README.md`.**
- [ ] **Step 2: Validate dimensions, file sizes, transparency where intended, and README rendering locally.**
- [ ] **Step 3: Run final clean-room/secret/license/dependency/full test gates on the exact launch commit.**
- [ ] **Step 4: Create GitHub repository initially private, push exact launch commit, configure description/topics/homepage/security settings/branch protection, verify CI, then switch visibility to public only after all server-side checks pass.**
- [ ] **Step 5: Create `v0.1.0` release only after public repository health, README, social preview, and install instructions are verified; retain rollback evidence.**
