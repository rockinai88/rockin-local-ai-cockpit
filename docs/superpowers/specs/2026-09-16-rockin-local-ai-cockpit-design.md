# RockIn Local AI Cockpit — Design Specification

Date: 2026-09-16
Status: Approved for implementation
Owner: rockinai88

## 1. Product goal

RockIn Local AI Cockpit is a public, local-first dashboard for Ollama users. It gives one place to chat with local models, inspect model/runtime state, view hardware telemetry, and explore the local AI stack through an interactive 3D graph.

Primary promise: **A beautiful local AI cockpit for Ollama — chat, models, hardware, and your AI stack in one interactive workspace.**

## 2. Clean-room boundary

This is a completely separate public project. No source code, secrets, private configuration, databases, logs, internal paths, or proprietary implementation details may be copied from private RockIn projects.

Allowed reuse is limited to generic engineering knowledge, public documentation, public open-source dependencies, and newly written code created for this repository.

## 3. v0.1 scope

The first public release includes: Ollama discovery, model listing, local chat with model switching, CPU/RAM/GPU/VRAM status, connection/runtime status, interactive 3D topology view, demo mode, responsive UI, and a one-command development start.

The first release excludes cloud providers, authentication, billing, remote execution, plugin marketplaces, browser agents, file write tools, telemetry, and automatic system modifications.

## 4. Architecture

Use a TypeScript monorepo with `apps/web`, `apps/server`, `packages/contracts`, and `packages/shared`. The browser never talks directly to Ollama or operating-system APIs; all privileged access stays in the local server.

The server binds to `127.0.0.1` only. The web app consumes a versioned local HTTP API. Shared contracts define all request/response shapes and runtime validation.

## 5. Components

`apps/web` owns presentation, navigation, chat UI, model selection, dashboard cards, accessibility, demo mode, and the 3D graph renderer.

`apps/server` owns Ollama detection, safe proxying to local Ollama, hardware sampling, health endpoints, graph snapshot assembly, and bounded error translation.

`packages/contracts` contains Zod schemas and TypeScript types for API boundaries. `packages/shared` contains pure utilities with no operating-system access.

## 6. Data flow

On startup the server validates configuration, binds to loopback, probes Ollama at an explicitly configured local URL, and exposes a health snapshot. The UI polls low-frequency status endpoints and uses request/response calls for chat.

Chat flow: browser → local server → Ollama → local server → browser. Prompts and responses are not persisted in v0.1. Demo mode never contacts Ollama and uses deterministic fixture data.

Graph flow: server converts current local runtime/model/hardware state into a bounded graph snapshot. The web renderer visualizes the snapshot without mutating runtime state.

## 7. Security and privacy

Default network authority is loopback only. Reject non-loopback bind addresses by default. Validate Host/Origin where applicable, bound request sizes, enforce JSON content types, sanitize error messages, and never expose filesystem paths or environment values to the browser.

No analytics, tracking pixels, remote fonts, external CDNs, or telemetry in the default build. No API keys are required for core functionality. A `.env.example` may document optional local settings but must contain no secrets.

Public-release gates include secret scanning, dependency audit, license audit, source-map review, forbidden-path scan, and a clean-room scan for private project names/paths.

## 8. UX direction

Dark, restrained cockpit aesthetic with strong information hierarchy. The first screen must explain the product within five seconds: connection state, selected model, chat entry point, hardware state, and visual graph.

The 3D graph is supplemental, not required for basic navigation. Reduced-motion users receive a static/low-motion experience. Keyboard navigation, focus visibility, semantic labels, and contrast are release requirements.

## 9. Performance targets

Cold local server startup target: under 2 seconds on the reference Windows laptop excluding Ollama model load. Dashboard interaction should remain responsive at 60 FPS where practical; 3D rendering must degrade gracefully on weaker GPUs.

Hardware polling defaults to 2 seconds. No endpoint may trigger expensive full-system scans on every poll. The graph snapshot is bounded and stable so UI updates do not rebuild unrelated state.

## 10. Reliability and errors

Every API response uses a documented contract and stable error code. Ollama unavailable is a normal state, not a crash. Hardware fields may be `unknown` when the OS cannot provide them. The UI must display degraded states without blocking the rest of the product.

The server exits on unsafe configuration such as non-loopback bind, invalid port, or malformed trusted-origin settings. Demo mode must always start without Ollama.

## 11. Testing strategy

Unit tests cover contracts, parsers, graph assembly, configuration, and error translation. Server integration tests use a fake Ollama HTTP server; they never require a real model download.

Web component tests cover critical states. Browser smoke tests cover demo start, Ollama-offline handling, model selection, chat success/error paths, responsive layout, and reduced motion.

Release verification requires TypeScript typecheck, ESLint, unit/integration tests, production build, browser smoke tests, secret scan, dependency/security audit, license allowlist, and clean-room/private-reference scan.

## 12. Open-source repository standard

Repository files: README, LICENSE, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT, CHANGELOG, ROADMAP, architecture docs, issue forms, pull-request template, Dependabot config, and a minimal CI workflow.

Use GitHub Topics aligned to actual functionality, such as `ollama`, `local-ai`, `llm`, `ai`, `typescript`, `react`, `threejs`, `privacy`, and `local-first`. Social Preview target is 1280×640 and is generated from original project assets.

The README order is: hero → one-sentence value → demo → quickstart → features → screenshots → architecture/privacy → roadmap → contributing → license.

## 13. GitHub governance

The public repository uses protected `main`, pull-request-only changes, conversation resolution, no force-pushes, and no branch deletion. Required status checks are enabled only after the CI workflow is proven stable.

Merge strategy is merge-commit only for traceability unless public contributor experience later shows a strong reason to change. Dependabot alerts, secret scanning, push protection, and code scanning are enabled where GitHub provides them for public repositories.

## 14. Release strategy

`v0.1.0` is published only after the full release gate passes on the exact release commit. Use semantic versioning and a human-readable changelog. No public release is created before the repository itself has a complete README, demo media, security policy, and reproducible quickstart.

## 15. Branding and media

Brand assets are original to this project. Blender 5.2.2 LTS may be used offline to create the logo, social preview, hero stills, and short demo animation. Render production uses the verified RTX 5060 OptiX path.

Do not use third-party logos in ways that imply affiliation. Product copy may truthfully state compatibility with Ollama while clearly remaining an independent community project.

## 16. Success criteria for v0.1

A new user can clone the repository, install dependencies, start demo mode, and see a polished working cockpit without Ollama. A user with Ollama running can discover models and complete a local chat without entering credentials.

The repository must pass all automated gates, contain no private-project material, have no known high/critical dependency vulnerabilities, and expose no network listener beyond loopback by default.

## 17. Future work, not v0.1

Desktop packaging with Tauri, Linux/macOS hardware adapters, session persistence, plugin APIs, MCP integration, richer graph sources, and optional packaged installers are deliberately deferred until the public v0.1 architecture proves stable.
