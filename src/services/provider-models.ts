import type { ModelChoice, ProviderConfig } from "../types";
import { connectionText as t } from "../i18n/connection";

/** User entries are separate from the replaceable remote catalog. Also migrate older manual IDs. */
export function manualProviderModels(provider: ProviderConfig): Array<Pick<ModelChoice, "id" | "name">> {
  const entries = new Map((Array.isArray(provider.manualModels) ? provider.manualModels : []).filter((model) => model && typeof model.id === "string" && typeof model.name === "string").map((model) => [model.id, model]));
  const reported = new Set((provider.models ?? []).map((model) => model.id));
  if (!provider.fetchedAt) for (const model of provider.models ?? []) if (!entries.has(model.id)) entries.set(model.id, { id: model.id, name: model.name });
  for (const id of provider.enabledModels ?? []) if (!reported.has(id) && !entries.has(id)) entries.set(id, { id, name: id });
  return [...entries.values()];
}
export function providerModels(provider: ProviderConfig): ModelChoice[] {
  const models = new Map<string, ModelChoice>();
  for (const model of provider.models ?? []) if (!models.has(model.id)) models.set(model.id, model);
  for (const manual of manualProviderModels(provider)) {
    const remote = models.get(manual.id);
    models.set(manual.id, { ...remote, id: manual.id, name: manual.name !== manual.id ? manual.name : remote?.name ?? manual.id, efforts: remote?.efforts ?? [] });
  }
  return [...models.values()];
}
export function refreshProviderModels(provider: ProviderConfig, remote: ModelChoice[]): ProviderConfig {
  const manual = new Map(manualProviderModels(provider).map((model) => [model.id, model]));
  // A selected model disappearing from discovery is not permission to delete the user's selection.
  for (const id of provider.enabledModels ?? []) if (!remote.some((model) => model.id === id) && !manual.has(id)) {
    const previous = provider.models?.find((model) => model.id === id);
    manual.set(id, { id, name: previous?.name ?? id });
  }
  return { ...provider, models: remote.filter((model, index) => remote.findIndex((entry) => entry.id === model.id) === index), manualModels: [...manual.values()], fetchedAt: Date.now() };
}
export function addManualProviderModel(provider: ProviderConfig, rawId: string, rawName = ""): ProviderConfig {
  const id = rawId.trim();
  if (!id || /\s/.test(id) || id.length > 200) throw new Error(t("invalidModel"));
  if (providerModels(provider).some((model) => model.id === id)) throw new Error(t("duplicateModel"));
  return { ...provider, manualModels: [...manualProviderModels(provider), { id, name: rawName.trim() || id }],
    enabledModels: [...new Set([...(provider.enabledModels ?? []), id])], model: provider.model || id };
}
