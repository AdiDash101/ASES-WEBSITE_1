# ASES Manila Landing Page

## Mission

Build the ASES Manila landing page in `/landing-page` from the Figma file below, but do it incrementally. The current scope is the design-system foundation only, not the full page implementation.

Figma source:
`https://www.figma.com/design/9lt1OQhQTnO7khoBMutuYy/ASES-Manila?node-id=733-375&m=dev`

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Tokens source of truth: `styles/tokens.css` and `tailwind.config.ts`

## Current System Decisions

- Map Figma variables first: `#FF2C07`, `#FFFFFF`, `#251E73`, `#97B6F8`, `#3F439C`.
- Keep the recurring sky accent `#64B4FF` because it appears in emphasis stickers and active states.
- Use `font-display` for hero text, section headings, buttons, and other high-emphasis labels.
- Use `font-sans` for supporting copy, metadata, and footer-style content.
- Prefer semantic primitives such as `ases-button-primary`, `ases-card`, `ases-kicker`, `ases-display`, and `ases-heading` over raw one-off utility strings.

## Design Constraints

- Preserve the white editorial canvas with subtle texture instead of switching to flat backgrounds.
- Keep the red and blue brand accents in tension; do not let one replace the other entirely.
- Recreate rotated media frames and collage energy when sections are implemented later.
- Do not pull in random UI kits or template sections.
- Cocogoose is part of the design language. Self-host it before final polish instead of replacing the direction with generic sans-only typography.

## Implementation Order

1. Lock the design tokens and semantic primitives.
2. Build the shell and navigation.
3. Implement the hero and collage section.
4. Add social proof, events, projects, and stories one section at a time.
5. Finish with footer polish, assets, and responsive QA.
