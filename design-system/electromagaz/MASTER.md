# Electromagaz design system

> Source of truth for public storefront UI. Page-specific files in `pages/` may override these rules.

## Design read

- Product: B2B electronic components catalog and request workflow.
- Audience: engineers, procurement specialists and radio enthusiasts.
- Character: precise, calm, technical and trustworthy.
- Redesign mode: targeted evolution. Preserve routes, content, forms and business logic.
- Dials: variance 5/10, motion 3/10, density 6/10.

## Principles

1. Search and MPN are the primary navigation tools.
2. Information hierarchy comes from type, spacing and borders, not stacked cards.
3. Use one blue accent. Status colors are reserved for semantic states.
4. Keep real product and storefront images. Do not create fake product UI or decorative data.
5. Motion is limited to direct interaction feedback. Page content does not wait for scroll reveals and no element moves in a decorative loop.
6. Use plain Russian copy. No version stamps, fake metrics, decorative labels or em dashes.

## Tokens

| Role | Value | CSS variable |
|---|---:|---|
| Canvas | `#F5F7FA` | `--canvas`, `--color-canvas` |
| Surface | `#FFFFFF` | `--surface`, `--color-surface` |
| Muted surface | `#F7F8FA` | `--surface-muted`, `--color-surface-muted` |
| Primary text | `#101828` | `--text-1`, `--color-ink` |
| Secondary text | `#344054` | `--text-2`, `--color-ink-2` |
| Muted text | `#667085` | `--text-3`, `--color-ink-3` |
| Quiet text | `#7D899C` | `--text-4`, `--color-ink-4` |
| Accent | `#1264D1` | `--azure`, `--color-azure` |
| Accent hover | `#0D51AE` | `--azure-hover`, `--color-azure-hover` |
| Accent tint | `#EDF4FF` | `--azure-light`, `--color-azure-light` |
| Border | `#E4E7EC` | `--border` |
| Strong border | `#D0D5DD` | `--border-2` |
| Success | `#18794E` | `--color-stock` |

## Typography

- Interface and headings: Geist through `next/font`.
- Technical values: Geist Mono only for MPN, article numbers and identifiers.
- Body: 16px where space allows, minimum 14px for secondary interface copy.
- Headings use tight negative tracking and sentence case.
- Long copy is limited to roughly 65 characters per line.

## Shape and elevation

- Controls: 10px radius.
- Cards: 14px radius.
- Panels and dialogs: 18px radius.
- Pills are reserved for tags, counts and statuses.
- Default surfaces have a border and no shadow.
- Shadows are reserved for overlays, dropdowns and sticky layers.

## Components

### Buttons

- Minimum height: 44px for primary mobile actions.
- Primary: blue background, white text, no gradient or glow.
- Secondary: white surface, visible border, primary text.
- Hover changes color or border only. Active state moves down by 1px.
- Labels stay on one line and use the same wording throughout a flow.

### Inputs

- Visible label for forms. Search may use a descriptive placeholder plus accessible name.
- White or muted surface with 1px border.
- Focus uses the blue border and a restrained 3px ring.
- Error copy states the cause and recovery action near the field.

### Cards and lists

- Use cards only for independent interactive objects.
- Prefer border-separated rows for categories, specifications and feature lists.
- Product cards use real images, visible MPN, manufacturer, availability and a clear cart action.

## Motion

- Standard duration: 150-300ms for controls.
- Animate only opacity and transform.
- Product image hover scale: 1.025 maximum.
- Respect `prefers-reduced-motion`; all essential content remains visible without JavaScript motion.

## Responsive rules

- Check 375px, 768px, 1024px and 1440px.
- Mobile touch targets are at least 44x44px with 8px spacing where adjacent.
- Asymmetric layouts collapse to one column below 768px.
- Bottom navigation must not cover the final page action or scroll content.
- No horizontal page scroll. Intentional local scrollers must be labelled and keyboard accessible.

## Forbidden patterns

- Purple or multicolor gradients, neon glows and blur blobs.
- Three equal marketing cards with interchangeable copy.
- Decorative pills, status dots, version labels and section numbering.
- Fake metrics, fake testimonials and fake product screenshots.
- Hover effects that lift every surface.
- Multiple accent colors or inconsistent gray families.
- Emoji used as interface icons.
- Em dashes in visible copy.

## Pre-delivery checklist

- [ ] Search, catalog, product, cart and quote actions still work.
- [ ] Focus is visible and keyboard order follows the visual order.
- [ ] Body text contrast is at least 4.5:1.
- [ ] Mobile touch targets are at least 44px.
- [ ] Reduced motion leaves all content visible.
- [ ] No fixed navigation covers content.
- [ ] No horizontal page scroll at target breakpoints.
- [ ] No visible em dashes, fake metrics, gradients or decorative glows.
- [ ] Lint, tests and production build pass.
