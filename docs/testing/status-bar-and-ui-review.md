# Status bar and pending UI review (2026-09-28)

The status bar is hidden only while an Agent leaf is active. It returns for Markdown leaves, when the Agent leaf closes, and on plugin unload. This rule ships in Agent's own stylesheet and works with Home disabled.

Compared the pending UI-polish work based on 0.3.2 against released 0.5.1 before integration. Palette definitions and tests, settings polish, runtime palette refresh, compact work status, interleaved reply timeline and native backend activities are already incorporated. The poster and infographic prompts are already in the newer prompt library, including author credit. Preserve the newer question cards, prompt management and Mermaid initial dark-theme fix; applying the old complete files would regress them.

Carried forward the missing regression assertions for exactly one live status and no obsolete connecting status. Existing timeline tests cover expansion preservation, visible approvals/failures and pending questions. The current prompt-library tests cover both image prompts. Historical local research and test-session notes are not runtime changes and remain with their source checkout.

Validation: 334 unit tests, typecheck and production build pass. Native-model calls and image generation are not newly certified by this UI review.
