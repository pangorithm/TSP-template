# TSP 템플릿

Tauri v2, SolidJS, Phaser로 데스크톱·모바일 게임을 만들기 위한 장르 중립적 기반입니다.

SolidJS 프런트엔드는 Tauri WebView에 포함되는 UI입니다. 독립 웹 애플리케이션으로 배포하지 않으며, 브라우저 빌드와 Playwright 테스트는 WebView에 들어갈 프런트엔드 품질을 검증하는 용도로만 사용합니다.

## 핵심 방향

- 게임 규칙, 콘텐츠, UI, 에셋, 저장 스키마를 기반 모듈에 넣지 않습니다.
- 공개 계약은 작고 안정적으로 유지하고 포트, 어댑터, 팩토리를 주입해 확장합니다.
- Phaser 인스턴스, 이벤트 리스너, 네트워크 연결 등 모든 런타임 리소스에 명확한 소유자와 정리 경로를 둡니다.
- 실제 확장 지점이 확인된 경우에만 추상화를 추가합니다.
- 엄격한 타입, 최소 네이티브 권한, 계약 테스트, 실제 브라우저 E2E로 동작을 보호합니다.

## 제공하는 기반

- Tauri 데스크톱·모바일 셸과 최소 capability
- SolidJS 메뉴, 로딩 상태, 시작 실패 복구
- Phaser 지연 로딩, 생성, 반응형 캔버스, 결정적 정리
- 창 포커스와 문서 표시 상태에 따른 일시 정지·재개
- 키보드, 포인터, 터치 입력을 호출자 정의 액션으로 변환하는 어댑터
- 호출자가 스토리지와 코덱을 주입하는 타입 기반 영속성 포트
- Chromium·WebKit E2E, Rust 검사, 네이티브 빌드, 공급망 검사 CI

각 게임은 게임플레이, 씬, 엔티티, 진행 구조, HUD, 오디오, 에셋, 입력 액션, 저장 스키마, 배포 정책을 별도 모듈로 구현합니다.

## TSP Backend

[`TSP-backend`](../TSP-backend)는 이 템플릿으로 만드는 여러 게임이 공통으로 사용할 백엔드 기반입니다. 게임 식별, 인증, 저장 데이터, 실시간 연결을 제공하며 `game_id`로 게임 간 데이터를 격리합니다.

`TSP-template`은 특정 API 스키마나 인증 방식에 결합하지 않습니다. 각 게임은 호출자 소유의 타입 기반 백엔드 포트를 정의하고 Tauri 네이티브 어댑터를 주입합니다.

- 프로덕션의 HTTP와 WebSocket 연결은 Tauri 네이티브 계층이 소유합니다.
- SolidJS와 Phaser 코드는 전역 `fetch`나 `WebSocket`으로 `TSP-backend`에 직접 연결하지 않습니다.
- HTTP는 URL 범위를 제한한 Tauri HTTP plugin 또는 작은 Rust command로 구현합니다.
- 지속적인 WebSocket은 Rust가 생성·재연결·종료하고 필요한 메시지만 Tauri command, channel, event 경계로 전달합니다.
- 인증 토큰과 연결 상태는 네이티브 어댑터가 소유하고 JavaScript에는 필요한 데이터만 전달합니다.
- plugin과 command를 추가할 때는 실제로 필요한 URL과 명령만 capability에 허용합니다.
- 인증, 권한, `game_id` 격리는 항상 백엔드에서도 검증합니다.

이 경계를 따르면 게임 코드는 네트워크 구현과 분리되고, 테스트에서는 같은 포트의 가짜 구현을 주입할 수 있습니다.

## 구조

- `src/App.tsx`: 메뉴 상태, Phaser 생성, 생명주기 연결, 정리
- `src/game/config.ts`: Phaser 설정과 시작 씬 등록
- `src/game/scenes/`: `BootScene`에서 비어 있는 `GameScene`으로 전환
- `src/game/input.ts`: 물리 입력을 호출자 정의 액션으로 매핑
- `src/game/dom-input.ts`: 키보드·포인터·터치 DOM 어댑터와 정리
- `src/game/persistence.ts`: 주입형 스토리지와 코덱을 사용하는 영속성
- `src/game/lifecycle.ts`: 표시 상태와 포커스에 따른 일시 정지 소유권
- `src-tauri/`: Rust 진입점, capability, 플랫폼 설정
- `__tests__/`: 기반 계약을 검증하는 Vitest 테스트
- `e2e/`: 실제 브라우저 동작을 검증하는 Playwright 테스트

## 주요 계약

### 시작과 복구

Phaser는 초기 메뉴에서 로드되지 않습니다. **Start**를 누르면 `src/game/config.ts`를 동적으로 가져와 게임을 생성합니다.

- 모듈 로딩 실패는 **Reload**로 복구합니다.
- 모듈 로딩 후 게임 생성 실패는 **Retry**로 복구합니다.
- App이 언마운트된 뒤 완료된 비동기 게임 생성 결과는 즉시 파괴합니다.
- `onStartupError`는 `{ stage, action, cause }`를 전달하며 로깅 구현은 호출자가 선택합니다.

### 영속성과 Continue

`createPersistence<T>`는 `hasSavedValue()`, `load()`, `save()`, `clear()`를 제공합니다. 기반 모듈은 저장 스키마, 코덱, `localStorage` 구현을 선택하지 않습니다.

**Continue** 버튼은 `createContinuationGame` 팩토리가 전달된 경우에만 표시되며 메뉴가 스토리지를 직접 조회하지 않습니다.

### 입력과 생명주기

`createActionInput`, `createActionDispatcher`, `installActionInputAdapter`는 장치 이벤트를 호출자가 정의한 액션으로 변환합니다. 게임플레이 효과는 입력 어댑터 밖에서 처리합니다.

`installGameLifecycle`은 백그라운드 상태나 포커스 상실로 자신이 정지시킨 게임만 재개합니다. App 정리 시 리스너를 제거하고 실제 Phaser 파괴 이벤트와 캔버스 제거가 완료되도록 처리합니다.

## 요구 사항과 실행

- Bun 1.3.11
- Rust 1.98.1
- 플랫폼별 Tauri 빌드 도구

```bash
bun install
bun run dev
bun run tauri -- dev
```

`bun run dev`는 WebView 프런트엔드 개발 서버를 실행합니다. 독립 웹 배포 명령이 아닙니다.

## 품질 검사

```bash
bun run check         # 감사, 포맷, 린트, 타입 검사, Vitest
bun run audit         # JavaScript 의존성 취약점 검사
bun run format:check  # Biome 포맷 검사
bun run lint          # Biome 린트
bun run typecheck     # TypeScript 검사
bun run test          # Vitest 계약 테스트
bun run check:bundle  # 초기 호스트 JavaScript 24 KiB 예산 검사
bun run test:e2e      # 빌드, 번들 예산, Chromium·WebKit E2E

cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo audit --file src-tauri/Cargo.lock
cargo deny --manifest-path src-tauri/Cargo.toml check bans licenses sources
```

## CI

`.github/workflows/ci.yml`은 모든 외부 Action을 커밋 SHA로 고정하고 다음 항목을 검사합니다.

1. Bun 품질 게이트와 Chromium·WebKit E2E
2. Rust 포맷, 검사, 테스트, Clippy
3. 고정 버전 `cargo-audit`, `cargo-deny`, Syft SBOM
4. Linux·Windows·macOS Tauri 빌드와 네이티브 시작 스모크
5. Android ARM64 디버그 APK와 iOS ARM64 시뮬레이터 빌드
6. SPDX JSON SBOM 아티팩트와 push 빌드 출처 증명

CI는 설치 프로그램 생성, 바이너리 서명, 실제 장치 테스트, 릴리스 게시를 수행하지 않습니다. Playwright WebKit도 Android WebView나 iOS WKWebView 장치 테스트를 대체하지 않습니다.

## 플랫폼 참고 사항

- **Windows/Linux/macOS**: `bun run tauri -- dev`, `bun run tauri -- build`
- **Android**: Android SDK와 NDK가 있는 환경에서 `bun run tauri -- android init`
- **iOS**: Xcode가 설치된 macOS에서만 초기화와 빌드 가능
- **생성 파일**: `src-tauri/gen/`은 모바일 초기화 결과이며 Git에서 무시
- **CSP**: `src-tauri/tauri.conf.json`은 로컬 에셋과 IPC만 허용하는 기본 정책을 정의
- **아이콘**: 배포 전 `src-tauri/icons/`의 기본 아이콘을 교체

## 라이선스

원본 코드와 문서는 [PolyForm Noncommercial License 1.0.0](LICENSE)에 따라 제공됩니다. 비상업적 사용, 수정, 재배포는 라이선스 조건에 따라 허용되지만 상업적 사용에는 별도 허가가 필요합니다.

이 프로젝트는 소스 공개형 소프트웨어이며 OSI 승인 오픈 소스는 아닙니다. 서드파티 의존성과 에셋에는 각각의 라이선스가 적용됩니다.

## 포함하지 않는 기능

- 예제 게임플레이, 레벨, 스프라이트, 사운드
- 저장 스키마, `localStorage` 바인딩, 데이터베이스 드라이버
- 브라우저 전용 백엔드 전송과 독립 웹 배포
- 자동 업데이트, 코드 서명, 릴리스 비밀 값
- 분석, 텔레메트리, 사용자 추적
- 초기화된 `src-tauri/gen/` 또는 미리 빌드된 바이너리
