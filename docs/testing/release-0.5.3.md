# 0.5.3 review and release candidate

## Scope review

Reviewed every dirty file in both active source checkouts against published `origin/main` (`df945dd`). Other available worktrees were clean.

| Draft group | Decision |
| --- | --- |
| Palettes, chat timeline, native-agent activity labels, settings spacing, associated tests | Already integrated in 0.4–0.5 releases. Retain main; do not commit old copies over it. |
| Old prompt UI, transport and type differences | Superseded by current Prompt library and question-card support. Reapplying the old tree would remove working features. Exclude. |
| Mermaid initial light state, old CSS selectors, build charset differences | Main contains later corrections; retain them. |
| Explicit transcript text selection | Still absent in main. Port only the scoped CSS rule. |
| Two image-generation prompts in old starter list | Current design explicitly excludes bundled image prompts. Keep in local archive; do not reintroduce obsolete prompt infrastructure or assume redistribution rights. |
| Historical research, testing drafts, nested `.claude` checkout | Preserve locally; do not publish workstation paths or nested repositories. |
| Custom-model transport, list/manual model management, mobile key paste | Include after regression review and fixes. |

Original drafts remain recoverable in the local archive commit `a0ac097` and `refs/archive/ui-polish-20260929`; neither is a release branch. Primary checkout reconciled to main. Local evidence images use dummy keys; historical workstation reports remain outside the published repository.

## Review corrections

- Failed provider persistence rolls back the provider and active connection while preserving unrelated edits; failed key rotations discard the newly allocated secret.
- Model controls cannot race a catalog refresh/key rotation. Errors from enable/default changes remain visible.
- Duplicate catalog IDs retain the first entry's metadata. Manual aliases, disabled entries, options and selections survive refresh.
- Native response construction failures reject and close the socket; buffered late results are ignored and errors are handled.
- Secret paste is user-triggered, leaves masking/focus intact, preserves drafts on denial/invalid clipboard and ignores stale completion. Mobile auto-focus removed and modal viewport listeners disposed.

## Validation

- Typecheck, 54 test files / 362 tests, production build, diff check and local release artifact audit passed. The optional tooltip scan flags existing model/data `title` fields and accessible icon labels; those are either false positives or the project’s explicit icon-tooltip exception. New paste actions use visible text and new status text is localized (Chinese/English).
- Real desktop Obsidian QA: all three user-selected provider/model routes discovered and returned OK through native streaming; manual/list coexistence, disabled manual alias refresh/reopen, default selection and secret-free config readback verified.
- Shared mobile key component: real host form/draft update with simulated clipboard; 340px width / 360px visual viewport, masked paste without input focus, permission denial preserving draft, 44px paste target and reachable save action.
- Native stream delivered data before EOF and AbortController closed the socket.
- Physical iOS is not available: real keyboard/permission UI remains unverified. Mobile/older-host requestUrl buffers responses and cannot physically cancel the underlying host request. Interactive Cloudflare challenges are reported, not bypassed.

## Prevent recurrence

`release:preflight` blocks dirty available worktrees, outdated candidate ancestry and inconsistent version files. CI runs the guard and tags can create only drafts. `.claude` checkouts are excluded from source control and test discovery. After release, reconcile the primary checkout and verify every relevant worktree is clean; never delete unfinished work merely to pass the guard.

Official final-SHA preview, draft-asset installation, anonymous release downloads and directory approval are separate release gates; their final evidence belongs to the PR/release record.
