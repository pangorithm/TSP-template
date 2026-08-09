# Design System — TSP Template (Game Screen Baseline)

## Scope

Minimal Phaser game canvas rendered inside a SolidJS shell. No UI chrome, menus, overlays, or product features.

## Tokens

| Token | Value | Usage |
|---|---|---|
| Canvas size | Viewport | Phaser responsive scale config |
| Background | #000000 | Phaser `backgroundColor` |
| Text color | #ffffff | Starter scene title |

## Layout

Single full-viewport `<div id="game-container">` fills the body. Phaser `parent` targets this div and resizes its canvas with the viewport. No overflow, no scroll.

## Accessibility

Canvas is decorative; no ARIA roles needed beyond the container div.

## Accepted Debt

- No design token system — the empty template scene uses only neutral canvas colors until a game defines its visual direction.
- No game UI — projects add their own menu, HUD, and controls after selecting a genre and design direction.
