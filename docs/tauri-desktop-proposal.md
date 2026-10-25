# Tauri desktop packaging proposal

Design scope for #8, reviewed against the official Tauri 2 documentation on
2026-10-25. This change adds no native runtime, installer or application permission.

## Boundary

Keep the existing React app, Fastify server and shared request/response contracts.
The browser version continues to use its current HTTP client. A future desktop
transport adapter implements the same client interface through narrow Rust
commands; it does not duplicate hardware, graph, Ollama or validation logic.

Bundle the built frontend as local WebView assets. The Rust supervisor owns one
fixed server sidecar, listens for a bounded readiness handshake and only opens
the UI after the expected child identity is verified. The server binds to
127.0.0.1 on an OS-assigned port. Do not reuse a process merely because its port
responds. A per-launch capability passed through a private pipe authenticates
the Rust-to-server channel; it never enters browser storage, argv or logs.
Introducing that channel requires separate negative contract tests before use.

Do not broaden the current browser CORS/Host policy to allow arbitrary WebView
or remote origins. The desktop adapter and supervisor require their own reviewed
implementation; the proposal does not authorize them to bypass the existing API.

## Lifecycle and permissions

Rust starts only the bundled, hash-verified sidecar with fixed arguments. The
WebView receives no generic shell, process, filesystem, updater or HTTP-plugin
capability. Remote pages and navigation cannot acquire native commands. Keep
logging bounded and exclude paths, environment values, credentials and prompts.

On exit or startup failure, stop only the owned child process tree, wait for a
bounded deadline and verify termination. Never terminate a separately running
browser server or Ollama instance. App closure does not stop the user's model
service. A second desktop instance focuses the first instance instead of spawning
another sidecar. Restart is explicit after a failed or ambiguous start.

| Platform | Packaging input                                                              | Separate acceptance                                                    |
| -------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Windows  | Locked Rust/MSVC build, matching sidecar, WebView2 prerequisite              | Start/exit, second instance, occupied port, crash and uninstall        |
| Linux    | Locked native build and matching sidecar, documented WebKitGTK prerequisites | Same lifecycle and loopback boundaries on a supported distribution     |
| macOS    | Locked native build and matching architecture sidecar                        | Same lifecycle on real macOS; Intel/Apple Silicon are distinct targets |

Tauri's `bundle.externalBin` requires the appropriate target-triple binary for
each package. Keep Cargo.lock, npm lockfile, exact toolchain versions and input
hashes. Build the web assets once per source revision; package manifests record
their hash and the native/sidecar hashes. Two clean builds must be compared;
timestamps or signing differences must be reported, not hidden.

## Validation and delivery

First retain the complete existing `npm run verify` gate. Then test the desktop
adapter against shared contracts, unauthorized methods, invalid input, failed
readiness, stale child identity, restart, shutdown and remote navigation. Native
installation and device smoke tests remain separate from a successful web build.
No telemetry, cloud account, paid service or model download is required.

Signing, notarization, installer publication and updates are later release work.
Document their platform prerequisites and costs before enabling them. Keep an
unsigned private test package distinct from a trusted signed release. Retain the
previous verified package and ordinary web app as the rollback path; do not
install a background service or introduce automatic updates in the first shell.

The proposal completes the architecture discussion deliverable. Native desktop
implementation begins only in a separate scope after design review.

## Official references

- [Embedding external binaries](https://v2.tauri.app/develop/sidecar/)
- [Node.js sidecars](https://v2.tauri.app/learn/sidecar-nodejs/)
- [Configuration reference](https://v2.tauri.app/reference/config/)
- [Shell permission scopes](https://v2.tauri.app/reference/javascript/shell/)
