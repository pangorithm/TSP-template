# TSP Template

Genre-neutral cross-platform game foundation built on Tauri v2 (Rust desktop/mobile shell), SolidJS (web host UI), and Phaser (game engine).

## Purpose & Scope

This repository provides a minimalist runtime seam for cross-platform games. It handles menu navigation, dynamic Phaser loading, visibility/focus pause recovery, input mapping, and persistence abstractions. The default game scene is intentionally blank; genre-specific mechanics, save schemas, UI components, and assets are added outside foundation modules.

## License

This project's original code and documentation are licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

- Noncommercial use, modification, and redistribution are permitted under the license terms.
- Commercial use is not granted by this license and requires a separate license from the relevant rights holders. For example, using this template to develop or distribute a paid game or an advertising-supported commercial game requires separate permission.
- The license also expressly permits the personal uses and organization uses described in its **Personal Uses** and **Noncommercial Organizations** sections. The full license controls these permissions.
- When redistributing covered material, include the license text or its URL and preserve any required notices.

This is source-available software, not OSI-approved open-source software. Third-party dependencies and assets retain their own licenses; this license does not replace them.

## Prerequisites

- **Bun**: 1.3.11
- **Rust**: 1.98.1 (pinned in `rust-toolchain.toml`, including Clippy, rustfmt, rust-analyzer, and rust-src)
- **Node/OS dependencies**: Standard C toolchain and webkit2gtk (Linux) or C++ build tools (Windows) for Tauri native compilation.

## Quick Start

```bash
# Install dependencies
bun install

# Run web host in development mode
bun run dev

# Run desktop app via Tauri
bun run tauri -- dev
```

## Architecture

- `src/App.tsx`: SolidJS root. Drives the menu state machine (`menu` -> `loading` -> `running` / `error`), handles lazy Phaser dynamic imports, mounts the canvas container, and binds lifecycle events.
- `src/game/config.ts`: Phaser configuration registering `BootScene` and empty `GameScene`.
- `src/game/lifecycle.ts`: Listens to `visibilitychange`, `blur`, and `focus`. Pauses the Phaser game loop when backgrounded or unfocused, and resumes only if lifecycle paused it.
- `src/game/input.ts`: Pure mapping and dispatch contracts for caller-defined action strings.
- `src/game/dom-input.ts`: Injected DOM event adapter for keyboard, pointer, and touch input with explicit teardown.
- `src/game/persistence.ts`: Storage abstraction requiring explicit injection of storage backends and typed codecs.
- `src-tauri/`: Tauri v2 Rust entrypoint, capabilities, and platform configuration.

## Key Seams & Design Patterns

### Lazy & Recoverable Startup
Phaser is not loaded on initial menu rendering. When the user clicks **Start**, `App.tsx` dynamically imports `src/game/config.ts` and initializes the Phaser instance. A failed dynamic import offers **Reload** because the rejected import is cached for the document lifetime. Failures after the module resolves, including Phaser initialization and injected Continue factories, offer **Retry** and repeat the retained startup request.

Unmounting App prevents a pending module from starting a game. A factory already in flight cannot be cancelled by App; its eventual game is destroyed instead.

Pass the optional `onStartupError` callback to receive `{ stage, action, cause }`: `stage` is `"module"` or `"creation"`, `action` is `"start"` or `"continue"`, and `cause` retains the original rejection value as `unknown`. The error UI stays neutral. The callback is synchronous, must not throw, and is not invoked after App unmounts. Consumers choose their own logging or reporting implementation.

### Injected Persistence & Continue Boundary
`createPersistence<T>` provides typed state handling with methods including `hasSavedValue()`, `load()`, `save()`, and `clear()`. Storage ports (e.g. `localStorage`, memory) and serialization codecs (e.g. JSON) are explicitly injected.
- **No save schema or `localStorage` implementation is chosen in foundation modules.**
- The **Continue** button appears in the main menu only when a `createContinuationGame` factory prop is passed to `App`. The menu itself does not query storage directly.

### Generic Input Adapter
`createActionInput`, `createActionDispatcher`, and `installActionInputAdapter` decouple raw hardware events from game logic:
- Accepts caller-defined binding records mapping keyboard key codes, pointer clicks, or touch events to abstract action identifiers (`TAction extends string`).
- Dispatches structured events (`{ action, source }`) to injected handlers without tying input directly to gameplay side-effects.

### Lifecycle Management
`installGameLifecycle` reconciles window focus and document visibility state. When visibility is hidden or focus is lost, it calls `game.loop.sleep()`. Upon return, it calls `game.loop.wake()`. It tracks whether pause was initiated by lifecycle to avoid waking games manually paused by the player.

App teardown removes its lifecycle listeners, schedules Phaser destruction, and wakes a stopped loop so Phaser can process the destruction frame. This final wake is resource cleanup, not gameplay resumption. The browser suite verifies the real Phaser destruction event and canvas removal, not only a mocked `destroy()` call.

## Commands & Quality Checks

### Web & Quality Gate
```bash
bun run check         # Run format, lint, typecheck, and unit-test gates
bun run format:check  # Check formatting via Biome
bun run lint          # Run Biome lints
bun run typecheck     # TypeScript check without emitting code
bun run test          # Run Vitest unit & integration contract tests
bun run test:e2e      # Build bundle and run Playwright end-to-end tests
```

### Tauri & Rust Desktop/Mobile
```bash
bun run tauri -- --version                 # Check Tauri CLI version
cargo check --manifest-path src-tauri/Cargo.toml  # Fast Rust compile check
cargo test --manifest-path src-tauri/Cargo.toml   # Run Rust tests
cargo fmt --manifest-path src-tauri/Cargo.toml --check # Check Rust code formatting
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings # Rust lints
```

## CI Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) executes three parallel jobs:
1. **Web Job**: Runs Bun 1.3.11 `format:check`, `lint`, `typecheck`, `test`, and `test:e2e` (Chromium via Playwright).
2. **Rust Job (Ubuntu)**: Installs Linux Tauri system dependencies and runs Rust 1.98.1 `cargo fmt --check`, `cargo check`, `cargo test`, and `cargo clippy`.
3. **Windows Native Job**: Installs the pinned Bun/Rust toolchains, runs locked Cargo checks/tests, and builds the native release executable with `bun run tauri -- build --no-bundle`.

CI does not create installers, sign binaries, or publish releases. macOS, Android, and iOS native execution remain separate platform checks; Chromium viewport tests do not substitute for device/WebView testing.

## Platform & Security Notes

### Content Security Policy (CSP)
Tauri security configuration (`src-tauri/tauri.conf.json`) defines a baseline CSP restricting `script-src` to `'self'` and restricting IPC/asset origins. Consumers loading remote assets, custom protocols, or external web sockets must extend this baseline policy.

### Icon Configuration
App icons are located in `src-tauri/icons/` (`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico`). Replace these assets with custom brand icons before production packaging.

### Platform Constraints
- **Desktop**: Windows and Linux builds run via standard Tauri CLI commands (`bun run tauri -- dev` / `bun run tauri -- build`).
- **Android**: Initialize native project files with `bun run tauri -- android init` (requires Android SDK and NDK).
- **iOS**: Target initialization and compilation require macOS with Xcode installed. The `tauri ios` subcommand is unavailable on non-macOS hosts.
- **Generated Folders**: Native mobile initialization generates `src-tauri/gen/`, which is git-ignored and should not be committed.

## Explicit Non-Goals

This template provides foundation architecture only and intentionally excludes:
- Sample gameplay mechanics, level maps, sprites, or sound assets
- Preconfigured save schemas, `localStorage` bindings, or database drivers
- Auto-updater setup, code signing certificates, or release secret configurations
- Analytics, telemetry, or user tracking integrations
- Initialized platform code in `src-tauri/gen/` or pre-built binaries
