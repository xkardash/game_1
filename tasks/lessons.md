# Lessons

## 2026-05-27 - Countdown Scope
- When adding countdown or pacing delays, confirm whether they apply only to the initial start or also between waves/levels.
- Do not add inter-wave waiting by default in fast arcade games; keep wave transitions immediate unless the user explicitly asks for pacing.
- For visual theme requests such as "space environment", replace placeholder/test visuals rather than layering cosmetic details over them.

## 2026-05-28 - In-Run HUD Space
- In-run information panels should not default to taking permanent canvas space; prefer compact toggles or collapsible panels for secondary stats.
- When adding debug/status visibility for the player, verify the closed state as well as the open state in browser tests.

## 2026-05-29 - Placeholder Naming
- Do not leave placeholder game names visible after the user rejects them; remove visible branding immediately and keep only generic accessible labels if needed.
- Treat naming as part of game feel, not a harmless placeholder.
