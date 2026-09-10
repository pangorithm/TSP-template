# Design System — TSP Template (Main Menu Baseline)

## 1. Research Log

- Genre-neutral game menu: system font stack, zero imagery, dark-to-neutral palette that reads cleanly across genres.
- Layout: single centered column, vertically and horizontally centered. Start is the sole interactive element at baseline; Continue appears only when a consumer injects a game factory.

## 2. Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0a0a0a` | Menu and app root background |
| `--color-surface` | `#141414` | Not used at baseline; reserved for future cards/panels |
| `--color-text` | `#e5e5e5` | Primary text (heading, body) |
| `--color-accent` | `#f0f0f0` | Start button text, hover background tint |
| `--color-focus-ring` | `#70b8ff` | Visible focus indicator on Start |
| `--color-border` | `#333` | Button default border |
| `--color-border-hover` | `#555` | Button hover border |
| `--color-bg-hover` | `rgba(255, 255, 255, 0.04)` | Button hover background tint |
| `--color-bg-active` | `rgba(255, 255, 255, 0.08)` | Button active/pressed background |
| `--font-sans` | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | All text |
| `--space-xs` | `0.5rem` | Tight internal padding |
| `--space-sm` | `1rem` | Small spacing |
| `--space-md` | `1.5rem` | Medium spacing |
| `--space-lg` | `2rem` | Large spacing |
| `--space-xl` | `3rem` | Section spacing |
| `--radius-sm` | `0.375rem` | Button border radius |
| `--transition-fast` | `120ms ease` | Focus ring and hover transitions |

## 3. Typography

| Level | Size | Weight | Usage |
|---|---|---|---|
| Display | `clamp(1.5rem, 4vw, 2.25rem)` | 600 | Game title / `h1` |
| Body | `1rem` (16px) | 400 | Button label |

No custom fonts. System font stack only.

## 4. Layout

Single `<main>` element centered in viewport via flexbox (`justify-content: center; align-items: center`).

```
<main class="menu" role="main">
  <h1>TSP Template</h1>
  <button type="button">Start</button>
</main>
```

Baseline (Start-only): heading above button with `--space-md` gap. Button is the sole focusable control.

**With Continue injected:** heading above two buttons with `--space-sm` gap between buttons and `--space-md` gap from heading to first button. Both buttons share identical styling; Continue appears only when a consumer injects the continuation factory.

**During startup:** the game container fills the viewport beneath a centered menu-colored status layer. Loading and startup-error states retain the title position, spacing, typography, and background of the menu so activation does not introduce a new visual direction.

## 5. Component Anatomy

### Start Button

- `<button type="button">Start</button>`
- Native element: pointer click, Enter, and Space all activate it without JS key handlers
- Minimum touch target: 44x44px (WCAG 2.5.8)
- Padding: `--space-xs` vertical, `--space-lg` horizontal
- Background: `transparent` border: `1px solid var(--color-border)`; hover: border lightens to `var(--color-border-hover)`
- Text color: `--color-accent`
- Border radius: `--radius-sm`
- Focus-visible ring: 2px solid `--color-focus-ring` with 2px offset, no outline removal on mouse
- Reduced motion: `prefers-reduced-motion: reduce` disables all transitions

### Continue Button (Optional, injected)

- `<button type="button">Continue</button>`
- Same native element, touch target, padding, colors, border radius, focus-visible ring, and reduced-motion behavior as Start button
- Availability: rendered only when the menu receives an injected game-factory function (typed `GameFactory`). When not injected, the button is not in the DOM.
- Persistence: the menu component itself does not read persistence and does not own a save schema. The injected factory owns all restore behavior, including whether a valid save exists. The Continue button being present is a proxy for "a factory was injected"; the factory handles restore on click.
- Disabled state: not used. If the factory is injected but no save exists, the factory controls whether Continue renders; the menu never toggles a disabled attribute.
- Action contract: clicking Continue invokes the injected `createContinuationGame` factory function, passing the game container element. The factory function itself is the continuation launch boundary — it creates and returns a Phaser.Game instance via the same lifecycle path as Start.

### Startup Status

- Loading: the title remains visible with a Body-level `Loading...` message using `--color-text`; the message has `role="status"` and polite live announcement behavior.
- Startup error: the title remains visible with the neutral Body-level message `Unable to start the game.` using `--color-text`; the message has `role="alert"`.
- Recovery uses the existing menu button primitive unchanged. A failed dynamic module load offers Reload because the rejected import is cached for the document lifetime. Failures after module resolution offer Retry and repeat the retained Start or Continue request.
- No spinner, icon, animation, new color, or additional elevation is introduced.

## 6. Accessibility

- `<main>` landmark for screen readers
- `<h1>` announces the game name
- One or two buttons (Start only at baseline, Start + Continue when factory injected) are keyboard-reachable via Tab with visible focus ring
- Color contrast: `#e5e5e5` on `#0a0a0a` = 14.9:1 ratio (exceeds WCAG AAA)
- Focus ring color `#70b8ff` on `#0a0a0a` = 8.2:1 (exceeds AAA)
- Button min size 44x44px meets WCAG 2.5.8 Target Size
- `prefers-reduced-motion: reduce` disables border-color and background-color transitions
- Loading is announced through a polite status region without moving focus.
- Startup failure is announced as an alert, and Retry is a native keyboard-reachable button with the existing focus treatment.

## 7. Responsive Behavior

| Breakpoint | Layout change |
|---|---|
| < 480px (mobile) | Heading at `clamp(1.5rem, 6vw, 2rem)`, buttons full-width with horizontal padding |
| 480px-1024px (tablet) | Heading at `clamp(1.5rem, 4vw, 2.25rem)`, buttons auto-width |
| > 1024px (desktop) | Heading at 2.25rem, buttons auto-width |

The menu is always vertically and horizontally centered at every viewport. When Continue is injected, both buttons stack in the same responsive pattern.

## 8. State Machine

```
[MENU] --Start/Continue--> [LOADING] --resolve--> [GAME]
                              |
                              |--module reject--> [ERROR] --Reload--> [MENU]
                              |--startup reject--> [ERROR] --Retry--> [LOADING]

[LOADING/GAME/ERROR] --unmount--> [DONE]
```

- **MENU**: App renders `<main>` with heading and Start button. No Phaser module or instance is loaded. If a continuation factory is injected, Continue is also rendered.
- **LOADING**: the selected action is retained, duplicate activation is ignored, the game container is mounted, and startup is announced. Start dynamically imports the default game module here; Continue invokes only its injected factory. Either factory may resolve immediately or asynchronously.
- **ERROR**: a neutral error message replaces the loading message. A dynamic-import failure offers Reload to create a fresh document; a later startup failure offers Retry and returns to LOADING with the retained action.
- **GAME**: the resolved Phaser instance receives lifecycle ownership and the status layer is removed. Phaser canvas fills the viewport.
- **DONE**: component unmount removes lifecycle listeners and destroys a running game. A game that resolves after unmount is destroyed immediately without installing lifecycle listeners.

## 9. Accepted Debt

- No settings or profile controls — genre-neutral baseline only.
- No imagery, icons, or third-party assets — system fonts and minimal surface.
- No animation beyond focus ring and hover transition — restrained by design.
- GameScene remains an empty black canvas until a genre implementation adds content.
- Menu neither reads persistence nor owns a save schema. The optional injected `createContinuationGame` factory is the continuation launch boundary; it determines whether Continue should appear and owns all restore behavior on click.
