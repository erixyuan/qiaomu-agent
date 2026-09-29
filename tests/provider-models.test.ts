import { describe, expect, it } from "vitest";
import { addManualProviderModel, providerModels, refreshProviderModels } from "../src/services/provider-models";
import { exposedModels, newProvider } from "../src/services/model-sources";
import { normalizeSettings } from "../src/defaults";
const model = (id: string, name = id) => ({ id, name, efforts: [] });

describe("remote discovery and manual entries coexist", () => {
  it("refreshes discovery without opting new models into the picker", () => {
    const p = refreshProviderModels({ ...newProvider("custom", []), enabledModels: [] }, [model("listed")]);
    expect(providerModels(p).map(x => x.id)).toEqual(["listed"]);
    expect(exposedModels(p)).toEqual([]);
  });
  it("retains a disabled manual model, its alias and parameters through refresh and restart", () => {
    let p = addManualProviderModel(newProvider("custom", []), "my-model", "日常模型");
    p = { ...p, enabledModels: [], model: "", modelOptions: { "my-model": { temperature: 0.4 } } };
    p = refreshProviderModels(p, [model("listed")]);
    p = normalizeSettings({ providers: [p] }).providers[0]!;
    expect(providerModels(p).map(x => x.id)).toEqual(["listed", "my-model"]);
    expect(p.manualModels).toEqual([{ id: "my-model", name: "日常模型" }]);
    expect(p.modelOptions?.["my-model"]?.temperature).toBe(0.4);
    expect(exposedModels(p)).toEqual([]);
    expect(exposedModels({ ...p, enabledModels: ["my-model"] })[0]?.name).toBe("日常模型");
  });
  it("merges an exact ID across both sources without overwriting its alias", () => {
    let p = addManualProviderModel(newProvider("custom", []), "model-v1", "My name");
    p = refreshProviderModels(p, [{ ...model("model-v1", "Vendor name"), vision: true }, model("model-v1")]);
    expect(providerModels(p)).toHaveLength(1);
    expect(providerModels(p)[0]?.name).toBe("My name");
    expect(p.enabledModels).toEqual(["model-v1"]);
    expect(() => addManualProviderModel(p, "model-v1")).toThrow("已在列表");
  });
  it("keeps dated and provider-prefixed IDs distinct even when names match", () => {
    const p = refreshProviderModels(newProvider("custom", []), [model("model", "Same"), model("vendor/model", "Same"), model("model-20260929", "Same")]);
    expect(providerModels(p)).toHaveLength(3);
  });
  it("preserves selected models missing from a refreshed catalog", () => {
    const p = refreshProviderModels({ ...newProvider("custom", []), models: [model("old")], fetchedAt: 1, enabledModels: ["old"], model: "old" }, []);
    expect(providerModels(p).map(x => x.id)).toEqual(["old"]);
    expect(p.model).toBe("old");
    expect(p.manualModels).toContainEqual({ id: "old", name: "old" });
  });
  it("migrates old ID-only manual entries and old manually connected providers", () => {
    const old = normalizeSettings({ providers: [{ ...newProvider("custom", []), enabledModels: ["legacy"] }] }).providers[0]!;
    expect(old.manualModels).toContainEqual({ id: "legacy", name: "legacy" });
    const previous = refreshProviderModels({ ...newProvider("custom", []), models: [model("kimi-k3")], enabledModels: ["kimi-k3"] }, [model("new")]);
    expect(providerModels(previous).map(x => x.id)).toEqual(["new", "kimi-k3"]);
  });
});
