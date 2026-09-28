# 0.5.1 UI refinement

Built on the released 0.5.0 base. Includes compact composer model/effort typography (12px/11px), settings alignment/neutral typography, a collapsed live work row with an SVG activity indicator, and two insert-only image prompts (poster credited to 小小东; Chinese X infographic). Pending questions, approvals and failures remain outside folded work. Existing prompt library and conversation storage stay compatible.

Validation: 334 tests, typecheck and production build passed. Obsidian 1.13.7 in the release QA vault loads 0.5.1 and reports model 12px / effort 11px. Prior settings checks covered four tabs in light/dark at 360/720px; logo center offset 0. No mobile-device or real image-generation claim.

Design references: https://vercel.com/geist/typography , https://vercel.com/geist/colors , https://elements.ai-sdk.dev/components/reasoning . Native Obsidian controls remain in use; no new dependencies or copied upstream source. Release requires official final-commit preview scan and public asset verification before the default branch version advances.
