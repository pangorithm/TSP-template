# TSP 템플릿

Tauri v2(Rust 데스크톱/모바일 셸), SolidJS(웹 호스트 UI), Phaser(게임 런타임)를 기반으로 하는 장르 중립적 크로스 플랫폼 게임 기반 프로젝트입니다.

## 이 저장소의 목적

크로스 플랫폼 Phaser 게임을 만드는 작업은 크게 두 종류로 나뉩니다.

1. **재사용 가능한 플랫폼 작업** — 네이티브 셸 통합, 게임 시작과 종료, 브라우저 생명주기 처리, 입력 변환, 영속성 경계, 반응형 호스팅, 크로스 플랫폼 검증
2. **게임별 작업** — 개별 게임에 속하는 규칙, 세계, 진행 구조, 콘텐츠, UI, 에셋, 조작 방식, 저장 스키마

이 두 관심사를 섞으면 기반 코드를 재사용하기 어려워지고, 새로운 게임을 만들 때마다 같은 생명주기와 플랫폼 문제를 다시 해결해야 합니다. TSP 템플릿은 두 영역을 분리합니다. 재사용 가능한 플랫폼 작업에는 작고 검증된 기반을 제공하면서 게임별 계층은 의도적으로 비워 둡니다.

이 프로젝트의 목표는 데모 게임이나 예제 메커니즘 모음을 제공하는 것이 아닙니다. 게임 팀이 공유 런타임 기반을 반복해서 수정하지 않고 자체 도메인 모듈을 추가할 수 있는 안정적인 출발점을 제공하는 것입니다.

### 기반 프로젝트가 담당하는 영역

- Tauri 데스크톱/모바일 셸 설정과 최소 네이티브 권한
- SolidJS 메뉴, 로딩, 시작 복구, Phaser 호스트 생명주기
- Phaser 지연 로딩, 인스턴스 생성, 결정적 정리, 반응형 캔버스 호스팅
- 브라우저 표시 상태와 포커스에 따른 일시 정지 소유권
- 장치 입력을 호출자가 정의한 액션으로 변환하는 매핑
- 호출자가 스토리지와 코덱을 제공하는 타입 기반 영속성 포트
- 엄격한 타입, 계약 테스트, 브라우저 E2E, Rust, 네이티브 빌드 품질 게이트

### 각 게임이 담당하는 영역

- 게임플레이 규칙, 씬, 엔티티, 진행 구조, 콘텐츠
- 게임별 메뉴, HUD, 시각 디자인, 오디오, 에셋
- 입력 액션 이름, 바인딩, 게임플레이 효과
- 저장 스키마, 마이그레이션, 코덱, 스토리지 선택
- 해당 게임에 필요한 네이티브 API, 권한, 텔레메트리, 배포, 출시 정책

재사용하고 교체할 수 있는 기반 위에서 웹과 Tauri 대상 Phaser 게임을 하나 이상 만들려는 경우 이 저장소를 사용하세요. 이 프로젝트를 게임 엔진, 특정 장르를 강제하는 프레임워크, 완성된 게임플레이 예제 모음으로 취급해서는 안 됩니다.

## 설계 우선순위

**확장성과 유지보수성이 이 템플릿의 가장 높은 우선순위입니다.** 새로운 게임별 기능을 추가할 때 공유 런타임 코드를 자주 수정하지 않아도 되는 기반을 지향합니다.

- 기반 모듈은 장르 중립적으로 유지하고 게임 규칙, 콘텐츠, 에셋, UI, 저장 스키마는 소비자 소유 모듈로 분리합니다.
- 브라우저 전역 객체, 스토리지 구현, 입력 장치, 게임 데이터 타입에 직접 의존하기보다 작고 안정적인 계약과 주입 가능한 어댑터를 사용합니다.
- Phaser 인스턴스, 이벤트 리스너, 일시 정지와 재개 전환을 포함한 모든 런타임 리소스에 명확한 소유자와 정리 경로를 둡니다.
- 실제 확장 지점이 확인된 경우에만 추상화를 추가합니다. 공개 API만 넓히는 추측성 옵션과 편의 기능은 피합니다.
- 외부에서 관찰할 수 있는 동작은 계약 테스트로 보호하고 브라우저와 런타임 통합은 실제 E2E 테스트로 검증합니다.
- 엄격한 타입, 최소 네이티브 권한, 결정적 빌드, 자동화된 품질 게이트를 선택적 도구가 아닌 유지보수 기능으로 취급합니다.

설계 목표가 충돌하면 게임별 코드를 기반 모듈 밖에 유지하고, 결합도를 낮추고, 공개 API를 작게 보존하며, 독립적으로 검증하고 교체하기 쉬운 방식을 우선합니다.

## 라이선스

이 프로젝트의 원본 코드와 문서는 [PolyForm Noncommercial License 1.0.0](LICENSE)에 따라 제공됩니다.

- 라이선스 조건에 따른 비상업적 사용, 수정, 재배포가 허용됩니다.
- 상업적 사용 권한은 이 라이선스에 포함되지 않으며 관련 권리 보유자의 별도 허가가 필요합니다. 예를 들어 이 템플릿으로 유료 게임이나 광고 기반 상업용 게임을 개발·배포하려면 별도 허가가 필요합니다.
- 라이선스에 명시된 **개인적 사용**과 **비영리 조직의 사용**도 허용됩니다. 정확한 조건은 라이선스 원문을 따릅니다.
- 적용 대상 자료를 재배포할 때는 라이선스 본문 또는 URL을 포함하고 필요한 고지를 유지해야 합니다.

이 프로젝트는 소스 공개형 소프트웨어이며 OSI 승인 오픈 소스는 아닙니다. 서드파티 의존성과 에셋에는 각각의 라이선스가 적용되며, 이 프로젝트의 라이선스가 이를 대체하지 않습니다.

## 사전 요구 사항

- **Bun**: 1.3.11
- **Rust**: 1.98.1 (`rust-toolchain.toml`에 Clippy, rustfmt, rust-analyzer, rust-src와 함께 고정)
- **Node/OS 의존성**: Tauri 네이티브 컴파일을 위한 표준 C 툴체인과 Linux의 webkit2gtk 또는 Windows의 C++ 빌드 도구

## 빠른 시작

```bash
# 의존성 설치
bun install

# 웹 호스트를 개발 모드로 실행
bun run dev

# Tauri 데스크톱 앱 실행
bun run tauri -- dev
```

## 아키텍처

- `src/App.tsx`: SolidJS 루트입니다. 메뉴 상태 머신(`menu` -> `loading` -> `running` / `error`)을 구동하고, Phaser 동적 가져오기와 캔버스 컨테이너 마운트, 생명주기 이벤트 연결을 담당합니다.
- `src/game/config.ts`: `BootScene`과 비어 있는 `GameScene`을 등록하는 Phaser 설정입니다.
- `src/game/lifecycle.ts`: `visibilitychange`, `blur`, `focus`를 관찰합니다. 백그라운드 상태이거나 포커스를 잃으면 Phaser 게임 루프를 정지하고, 생명주기 코드가 정지시킨 경우에만 재개합니다.
- `src/game/input.ts`: 호출자가 정의한 액션 문자열을 위한 순수 매핑 및 디스패치 계약입니다.
- `src/game/dom-input.ts`: 키보드, 포인터, 터치 입력을 명시적인 정리 동작과 함께 연결하는 주입형 DOM 이벤트 어댑터입니다.
- `src/game/persistence.ts`: 스토리지 백엔드와 타입 기반 코덱의 명시적 주입을 요구하는 스토리지 추상화입니다.
- `src-tauri/`: Tauri v2 Rust 진입점, capability, 플랫폼 설정입니다.

## 주요 확장 지점과 설계 패턴

### 지연 로딩과 복구 가능한 시작

Phaser는 초기 메뉴 렌더링 시 로드되지 않습니다. 사용자가 **Start**를 클릭하면 `App.tsx`가 `src/game/config.ts`를 동적으로 가져와 Phaser 인스턴스를 초기화합니다. 실패한 동적 가져오기는 문서의 수명 동안 캐시되므로 모듈 로딩 실패 시 **Reload**를 제공합니다. 모듈이 로드된 이후 Phaser 초기화나 주입된 Continue 팩토리에서 실패하면 **Retry**를 제공하고 보존된 시작 요청을 다시 실행합니다.

App이 언마운트되면 대기 중인 모듈이 게임을 시작하지 못하게 합니다. 이미 실행 중인 팩토리는 App에서 취소할 수 없으므로 나중에 반환된 게임 인스턴스를 즉시 파괴합니다.

선택적 `onStartupError` 콜백은 `{ stage, action, cause }`를 전달받습니다. `stage`는 `"module"` 또는 `"creation"`, `action`은 `"start"` 또는 `"continue"`이며 `cause`는 원래의 거부 값을 `unknown`으로 보존합니다. 오류 UI는 중립적인 상태를 유지합니다. 콜백은 동기식이어야 하고 예외를 던지면 안 되며 App 언마운트 이후에는 호출되지 않습니다. 로깅과 오류 보고 구현은 소비자가 선택합니다.

### 주입형 영속성과 Continue 경계

`createPersistence<T>`는 `hasSavedValue()`, `load()`, `save()`, `clear()`를 포함한 타입 기반 상태 처리를 제공합니다. 스토리지 포트(예: `localStorage`, 메모리)와 직렬화 코덱(예: JSON)은 명시적으로 주입합니다.

- **기반 모듈은 저장 스키마나 `localStorage` 구현을 선택하지 않습니다.**
- **Continue** 버튼은 `createContinuationGame` 팩토리 prop이 App에 전달된 경우에만 메인 메뉴에 표시됩니다. 메뉴는 스토리지를 직접 조회하지 않습니다.

### 범용 입력 어댑터

`createActionInput`, `createActionDispatcher`, `installActionInputAdapter`는 원시 하드웨어 이벤트와 게임 로직을 분리합니다.

- 호출자가 정의한 바인딩 레코드를 받아 키보드 키 코드, 포인터 클릭, 터치 이벤트를 추상 액션 식별자(`TAction extends string`)로 매핑합니다.
- 입력을 게임플레이 부수 효과에 직접 연결하지 않고 구조화된 이벤트(`{ action, source }`)를 주입된 핸들러로 전달합니다.

### 생명주기 관리

`installGameLifecycle`은 창 포커스와 문서 표시 상태를 조정합니다. 화면이 숨겨지거나 포커스를 잃으면 `game.loop.sleep()`을 호출하고, 다시 활성화되면 `game.loop.wake()`를 호출합니다. 생명주기 코드가 일시 정지했는지 추적하므로 플레이어가 직접 멈춘 게임을 임의로 재개하지 않습니다.

App 정리 과정은 생명주기 리스너를 제거하고 Phaser 파괴를 예약하며, 정지된 루프가 파괴 프레임을 처리할 수 있도록 깨웁니다. 마지막 wake 호출은 게임플레이 재개가 아니라 리소스 정리를 위한 동작입니다. 브라우저 테스트는 목으로 만든 `destroy()` 호출만 검사하지 않고 실제 Phaser 파괴 이벤트와 캔버스 제거를 검증합니다.

## 명령어와 품질 검사

### 웹 및 품질 게이트

```bash
bun run check         # 의존성 감사, 포맷, 린트, 타입 검사, 단위 테스트 실행
bun run audit         # 잠긴 의존성 그래프의 알려진 취약점 검사
bun run format:check  # Biome 포맷 검사
bun run lint          # Biome 린트 실행
bun run typecheck     # 출력 파일을 만들지 않고 TypeScript 검사
bun run test          # Vitest 단위 및 통합 계약 테스트 실행
bun run check:bundle  # 빌드 후 초기 호스트 JavaScript의 24 KiB 예산 검사
bun run test:e2e      # 빌드, 번들 예산 검사, Chromium/WebKit E2E 실행
```

### Tauri 및 Rust 데스크톱/모바일

```bash
bun run tauri -- --version                 # Tauri CLI 버전 확인
cargo check --manifest-path src-tauri/Cargo.toml  # 빠른 Rust 컴파일 검사
cargo test --manifest-path src-tauri/Cargo.toml   # Rust 테스트 실행
cargo fmt --manifest-path src-tauri/Cargo.toml --check # Rust 코드 포맷 검사
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings # Rust 린트
cargo audit --file src-tauri/Cargo.lock # RustSec 취약점 검사
cargo deny --manifest-path src-tauri/Cargo.toml check bans licenses sources # 의존성 정책 검사
```

## CI 파이프라인

GitHub Actions 워크플로(`.github/workflows/ci.yml`)는 변경 불가능한 Action 커밋 SHA를 사용하며 다음 게이트를 실행합니다.

1. **웹**: Bun 감사, 포맷, 린트, 타입 검사, Vitest 계약, 초기 번들 예산, Chromium과 WebKit의 전체 Playwright 테스트
2. **Rust**: Rust 1.98.1 포맷, 잠긴 의존성 검사와 테스트, Clippy
3. **Rust 공급망**: 고정된 `cargo-audit`와 `cargo-deny` 버전으로 `Cargo.lock`과 `deny.toml` 검사
4. **데스크톱 매트릭스**: Linux, Windows, macOS에서 잠긴 Rust 검사와 테스트, Tauri `--no-bundle` 빌드, 짧은 네이티브 프로세스 시작 스모크 테스트
5. **모바일**: Ubuntu에서 서명되지 않은 Android ARM64 디버그 APK 빌드, macOS에서 iOS ARM64 시뮬레이터 디버그 빌드. 각 작업은 무시되는 `src-tauri/gen/` 프로젝트를 다시 생성합니다.
6. **SBOM 및 출처 증명**: 모든 실행에서 SPDX JSON SBOM 아티팩트를 만들고 push 실행에서는 GitHub 빌드 출처 증명을 생성합니다.

CI는 데스크톱 설치 프로그램 생성, 바이너리 서명, 실제 장치 테스트, 릴리스 게시를 수행하지 않습니다. Playwright WebKit은 브라우저 엔진 범위만 검증하며 Android WebView 또는 iOS WKWebView 장치 테스트를 대체하지 않습니다. 24 KiB 예산은 초기에 로드되는 호스트 진입점에만 적용되며, 지연 로딩되는 Phaser와 게임 청크 크기는 소비자가 관리하도록 제한하지 않습니다.

## 플랫폼 및 보안 참고 사항

### 콘텐츠 보안 정책(CSP)

Tauri 보안 설정(`src-tauri/tauri.conf.json`)은 `script-src`를 `'self'`로 제한하고 IPC와 에셋 출처를 제한하는 기본 CSP를 정의합니다. 원격 에셋, 사용자 정의 프로토콜, 외부 WebSocket을 사용하는 소비자는 이 기본 정책을 확장해야 합니다.

### 아이콘 설정

앱 아이콘은 `src-tauri/icons/`의 `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, `icon.ico`에 있습니다. 프로덕션 패키징 전에 사용자 브랜드 아이콘으로 교체하세요.

### 플랫폼 제약

- **데스크톱**: Windows와 Linux에서는 표준 Tauri CLI 명령(`bun run tauri -- dev`, `bun run tauri -- build`)을 사용합니다.
- **Android**: Android SDK와 NDK가 설치된 환경에서 `bun run tauri -- android init`으로 네이티브 프로젝트를 초기화합니다. CI는 서명되지 않은 ARM64 디버그 APK를 검증하며 서명과 장치 테스트는 소비자가 담당합니다.
- **iOS**: 초기화와 컴파일에는 Xcode가 설치된 macOS가 필요합니다. CI는 ARM64 시뮬레이터 디버그 빌드를 검증하며 서명, App Store 내보내기, 실제 장치 테스트는 소비자가 담당합니다. Windows에서는 `tauri ios` 하위 명령을 사용할 수 없습니다.
- **생성 폴더**: 모바일 네이티브 초기화는 Git에서 무시되며 커밋하면 안 되는 `src-tauri/gen/`을 생성합니다.

## 명시적인 비목표

이 템플릿은 기반 아키텍처만 제공하며 다음 항목은 의도적으로 포함하지 않습니다.

- 예제 게임플레이 메커니즘, 레벨 맵, 스프라이트, 사운드 에셋
- 사전 구성된 저장 스키마, `localStorage` 바인딩, 데이터베이스 드라이버
- 자동 업데이트 설정, 코드 서명 인증서, 릴리스 비밀 값 설정
- 분석, 텔레메트리, 사용자 추적 통합
- 초기화된 `src-tauri/gen/` 플랫폼 코드 또는 미리 빌드된 바이너리
