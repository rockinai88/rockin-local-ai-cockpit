# Changelog

All notable changes follow Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [0.1.2] - 2026-09-16

### Fixed

- Disable Ollama thinking for normal chat models so reasoning tokens cannot consume the visible answer budget.
- Use Ollama `think: "low"` for GPT-OSS compatibility.
- Reject empty visible model responses instead of returning a blank chat message.
- Preserve bounded `MODEL_EMPTY_RESPONSE` errors through the local API and show a specific UI message.

## [0.1.1] - 2026-09-16

### Security

- Reject non-loopback `Host` headers before route handling.
- Reject untrusted browser origins with bounded `403` responses.
- Prevent local filesystem details from leaking through hardware and graph failures.

### Fixed

- Normalize invalid hardware counters and use safe unknown-device fallbacks.
- Accept zero total RAM as an explicit unknown telemetry fallback.
- Keep hardware sampling cached for two seconds to avoid unnecessary probes.

## [0.1.0] - 2026-09-16

### Added

- Initial local-first cockpit architecture.
- Ollama model discovery and local chat API.
- Hardware telemetry and bounded 3D topology.
- Deterministic Demo Mode and browser smoke tests.

[Unreleased]: https://github.com/rockinai88/rockin-local-ai-cockpit/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/rockinai88/rockin-local-ai-cockpit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/rockinai88/rockin-local-ai-cockpit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/rockinai88/rockin-local-ai-cockpit/releases/tag/v0.1.0
