# TSP Template

Genre-neutral cross-platform game foundation built on Tauri v2 (Rust desktop/mobile shell), SolidJS (web host UI), and Phaser (game engine).

## Purpose & Scope

This repository provides a minimalist runtime seam for cross-platform games. It handles menu navigation, dynamic Phaser loading, visibility/focus pause recovery, input mapping, and persistence abstractions. The default game scene is intentionally blank; genre-specific mechanics, save schemas, UI components, and assets are added outside foundation modules.

## Prerequisites

- **Bun**: 1.3.11
- **Rust**: 1.88.0
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

## Commands & Quality Checks

### Web & Quality Gate
```bash
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

GitHub Actions workflow (`.github/workflows/ci.yml`) executes two parallel jobs on `ubuntu-latest`:
1. **Web Job**: Runs Bun 1.3.11 `format:check`, `lint`, `typecheck`, `test`, and `test:e2e` (Chromium via Playwright).
2. **Rust Job**: Runs Rust 1.88.0 `cargo fmt --check`, `cargo check`, `cargo test`, and `cargo clippy`.

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
