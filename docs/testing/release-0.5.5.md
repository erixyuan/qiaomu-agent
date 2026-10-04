# 0.5.5 validation

Completed reply timelines rendered each failed activity twice: once in the processed-work record and once as a persistent red alert outside it. Remove the completed-turn duplicate, preserving the activity, failure marker, and error detail inside the record. Separate live/completed disclosure identities reset manual live expansion at completion. A stopped turn without a final explanation keeps a concise warning; pending confirmations and questions remain outside the log. Transport connection errors and retry controls are unchanged.

- Typecheck, 55 test files / 367 tests, and production build passed. Timeline regressions cover recovery after a failed attempt, retained expandable errors, collapsed completion, final failure explanations, pending approvals/questions, and interrupted replies without a final explanation.
- Desktop Obsidian verification in the isolated qiaomu-home-dashboard-qa vault passed: completed failures were collapsed, error details expanded on click, the final reply remained outside the record, failure-only replies showed a concise warning, and final failure explanations did not duplicate commands. No host errors were collected.
- Checked AI Elements Chain of Thought and Tool documentation on 2026-10-04. They offer disclosure composition; the existing native details/summary implementation already preserves the plugin's ordered activity model and Obsidian styling, so this localized fix keeps it without adding Radix/Tailwind components or copying new third-party source.
- Existing Chinese UI wording is retained. No settings or stored conversation migration is required. Mobile device validation is outstanding.

Official preview scanning, frozen draft-asset installation, public asset verification, and directory review remain independent release gates; their evidence is collected outside the repository.
