# 0.5.4 validation

The settings modal persisted refreshed Agent catalogs and notified open views, but the active view preferred an older local copy. Remove the duplicate catalog and derive menus and selected-model metadata from settings on every render. Backend preparation remains separate and does not run during streaming.

- Typecheck, 55 test files / 365 tests, and production build passed. Regression tests cover catalog replacement while idle or streaming, unchanged selection, enabled/manual entries, and empty catalogs.
- Real desktop Obsidian validation in an isolated QA vault passed: an already-open menu immediately replaced the old catalog after settings persistence; visibility and manual IDs updated; empty catalogs cleared stale entries; the composer draft and selected model were preserved. No errors were collected.
- No UI layout or user-facing strings changed. Mobile device validation is outstanding.

Official preview scanning, draft-asset installation, public asset verification, and directory review remain separate gates. A draft release does not establish public availability.
