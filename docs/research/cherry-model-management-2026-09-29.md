# Cherry Studio model management review

Reviewed 2026-09-29. Source commit `e22924df9838b722754c668f9ec4dcaf21af0491`. License: AGPL-3.0; no Cherry source code copied into this MIT plugin.

## Evidence

- [Provider settings documentation](https://github.com/CherryHQ/cherry-studio-docs/blob/main/pre-basic/settings/providers.md): discovered models are explicitly added to the user's list; connection checks are separate actions and actual API IDs are shown.
- [Manual model documentation](https://cherryai.com/docs/en/mobile/model-management/): exact IDs, optional display names, per-provider duplicate prevention; editing names does not change the called model ID.
- [Manual add UI](https://github.com/CherryHQ/cherry-studio/blob/e22924df9838b722754c668f9ec4dcaf21af0491/src/renderer/pages/settings/ProviderSettings/ModelList/ProviderModelAdd.tsx): independent add action.
- [Add form](https://github.com/CherryHQ/cherry-studio/blob/e22924df9838b722754c668f9ec4dcaf21af0491/src/renderer/pages/settings/ProviderSettings/ModelList/ModelDrawer/AddModelFormPanel.tsx): validates exact IDs against existing provider models, then creates user entries.
- [Pull reconciliation](https://github.com/CherryHQ/cherry-studio/blob/e22924df9838b722754c668f9ec4dcaf21af0491/src/renderer/pages/settings/ProviderSettings/ModelList/useProviderModelPullReconcile.ts): remote retrieval and explicit user addition/removal are separate.

## Applied to Qiaomu Agent

Save the provider credentials first, without requiring discovery or a paid model test. The same model section exposes **Get model list** and **Add manually** together; testing is an independent per-model or default-model action. Remote results are not silently enabled. An added manual ID is enabled explicitly by that add action.

Persist remote `models`, user `manualModels`, selected `enabledModels`, and per-ID `modelOptions` separately. Merge by exact ID, preserve manual names, keep dated/prefixed IDs distinct. Refresh replaces only the remote catalog and retains manual entries, disabled manual entries, parameters, and selected entries that disappeared from discovery. Older ID-only manual entries are migrated on settings load.

We keep native Obsidian controls and the existing compact toggle list rather than importing Cherry's drawer framework, database/IPC architecture, registry package, multi-key rotation or complex pricing controls. The existing native network transport and secret-eye control remain unchanged.
