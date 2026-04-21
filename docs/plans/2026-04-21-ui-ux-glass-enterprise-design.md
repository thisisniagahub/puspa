# 2026-04-21 — PUSPA UI/UX 2026: Premium Glass + Clean Enterprise

## Goal
Upgrade PUSPA UI/UX to feel **2026-premium**, inspired by modern “AI workspace” products:
- glassmorphism (tasteful, not gimmicky)
- typography-led clarity
- high trust (NGO ops) + high speed (operator workflows)

## Non-goals
- No neon/cyber vibe
- No heavy redesign of business logic
- No breaking UX changes that slow operators down

## Visual system
### Background
- subtle multi-stop gradient (purple → indigo → near-white)
- optional fine noise overlay (very low opacity)

### Surfaces (Glass)
- `glass-card`: semi-transparent surface, backdrop blur, thin border, soft shadow
- `glass-sidebar`: slightly stronger blur and darker tint
- `glass-topbar`: sticky, blur, subtle border-bottom

### Depth
- only 2-3 elevation levels max
- shadows are soft and spread (no hard shadows)

### Motion
- short, crisp (120–200ms), ease-out
- avoid long bouncy motion; ops UI should feel fast

## Implementation rules
1. **Tokens first**: add CSS variables for glass surfaces + gradients.
2. **Component-first**: implement glass via shared primitives (Card / Sidebar / TopBar classes), not per-page hacks.
3. **Accessibility**: keep contrast AA; avoid low-contrast text on glass.

## Rollout plan
- Phase 1: tokens + core layout primitives
- Phase 2: dashboard + memos page upgrade (showcase)
- Phase 3: roll to remaining pages (cases, disbursements, etc.)
