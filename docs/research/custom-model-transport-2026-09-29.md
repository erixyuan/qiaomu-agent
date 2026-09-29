# Custom model connection interoperability

Date: 2026-09-29. Baseline: 0.5.2 (`df945dd`).

## Sources and decisions

- [Obsidian requestUrl](https://docs.obsidian.md/Reference/TypeScript%20API/requestUrl): host HTTP requests have no renderer CORS restrictions. The installed public API exposes a buffered body, not a streaming reader or cancellation handle.
- [Electron net](https://www.electronjs.org/docs/latest/api/net): Chromium-native HTTP supports OS proxies. Use the host's available desktop native request API; do not bundle Electron into mobile. Construct a local Response/ReadableStream from request events, avoiding cross-process Response serialization.
- [AI SDK OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai): provider factories support a custom fetch adapter and base URL. Apply the same transport to discovery, Chat Completions, Responses and Anthropic messages. Keep API protocol explicit; model names do not determine the protocol (Gemini/Kimi may be served through OpenAI-compatible gateways).
- [Cloudflare challenges](https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/): OPTIONS preflight does not include clearance cookies. Native API transport avoids preflight, but cannot solve enforced interactive challenges, invalid credentials, exhausted quota or IP blocking. Identify `cf-mitigated: challenge` and HTML responses; do not present WAF rejection as an invalid key.
- [AI Elements Model Selector](https://elements.ai-sdk.dev/components/model-selector) is a selection UI, not a provider credential form. Its Connection component draws graph edges. Retain Obsidian Modal/native inputs and its Lucide icons; no new UI library is justified for this form. No external implementation copied.

## Behavior

1. Each Add creates a distinct connection and secret reference, even at the same URL. Editing an existing connection is the explicit key rotation path.
2. Save provider credentials independently of discovery and inference. Model discovery and manual addition are parallel actions; discovered models require explicit enablement. Tests are separate and never implied by saving. See the Cherry follow-up review for model reconciliation semantics.
3. No hidden POST replay/fallback across transports, no disabled TLS checks, no browser cookies or Origin header. Desktop redirects are refused before forwarding credentials.
4. Desktop transport streams and cancels the native request; mobile/older hosts use buffered requestUrl. In that fallback, UI cancellation ignores late results but the host API cannot physically abort the request; redirect behavior belongs to the host. Physical mobile streaming/cancellation are not claimed verified.
5. Input drafts survive failures. Credentials are masked by default; an accessible eye toggle changes only the draft field and preserves selection, without rebuilding the form. Closing a dialog cancels its pending network validation when present.
6. New copy is in a typed Chinese/English dictionary; the existing plugin's other Chinese UI text is not migrated in this scoped change.

## Regression contract

Streaming before EOF, fragmented UTF-8, abort before/after headers, consumer cancellation, idle timeout, redirect refusal, HTML challenge errors, no POST replay, same-URL key isolation, manual validation failure, empty discovery, exact model IDs and saved secrets. Real host UI checks cover secret toggle, failed draft retention and model connectivity.
