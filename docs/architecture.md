# Architecture

RockIn Local AI Cockpit is a clean-room TypeScript monorepo.

`apps/web` is an unprivileged React/Vite UI. `apps/server` is the only component allowed to access Ollama and hardware telemetry. `packages/contracts` owns strict Zod request/response boundaries.

The server defaults to `127.0.0.1:43123`; Ollama defaults to `127.0.0.1:11434`. Non-loopback server binds and non-local Ollama URLs are rejected. Chat history is in-memory only in v0.1.

The topology renderer consumes a bounded graph snapshot and is lazy-loaded. It cannot mutate the runtime. Demo Mode uses deterministic fixtures and never contacts Ollama.
