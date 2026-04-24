/**
 * Carrega o widget Chatwoot uma vez e expõe show/hide/identificação do contacto.
 * URL e token do inbox Website (altera aqui se mudares de instância ou inbox).
 */
const CHATWOOT_BASE_URL = "https://suporte.emplyon.com".replace(/\/$/, "");
const CHATWOOT_WEBSITE_TOKEN = "KzGDWMisFsk3G12sPsu5XJge";

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (opts: { websiteToken: string; baseUrl: string }) => void };
    $chatwoot?: {
      toggleBubbleVisibility: (v: "show" | "hide") => void;
      setUser: (identifier: string, attrs: { email: string; name?: string }) => void;
      setCustomAttributes: (attrs: Record<string, string | number | boolean>) => void;
      reset: () => void;
    };
  }
}

let injectPromise: Promise<void> | null = null;
let sdkRunDone = false;

export function isChatwootConfigured(): boolean {
  return Boolean(CHATWOOT_BASE_URL && CHATWOOT_WEBSITE_TOKEN);
}

function whenChatwootReady(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (window.$chatwoot) {
      resolve();
      return;
    }
    const timeoutMs = 20000;
    const t = window.setTimeout(() => resolve(), timeoutMs);
    window.addEventListener(
      "chatwoot:ready",
      () => {
        window.clearTimeout(t);
        resolve();
      },
      { once: true }
    );
  });
}

function ensureScriptInjected(): Promise<void> {
  if (typeof document === "undefined" || !isChatwootConfigured()) {
    return Promise.resolve();
  }

  if (injectPromise) return injectPromise;

  injectPromise = new Promise((resolve, reject) => {
    window.chatwootSettings = {
      position: "right",
      type: "standard",
      launcherTitle: "",
      ...(window.chatwootSettings ?? {}),
    };

    const existing = document.querySelector('script[data-emplyon-chatwoot="1"]');
    if (existing) {
      whenChatwootReady()
        .then(() => resolve())
        .catch(reject);
      return;
    }

    const g = document.createElement("script");
    g.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    g.async = true;
    g.dataset.emplyonChatwoot = "1";
    g.onload = () => {
      const readyPromise = whenChatwootReady();
      try {
        if (!sdkRunDone && window.chatwootSDK) {
          window.chatwootSDK.run({
            websiteToken: CHATWOOT_WEBSITE_TOKEN,
            baseUrl: CHATWOOT_BASE_URL,
          });
          sdkRunDone = true;
        }
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
        return;
      }
      readyPromise.then(() => resolve()).catch(reject);
    };
    g.onerror = () => reject(new Error("Falha ao carregar o SDK do Chatwoot"));
    document.head.appendChild(g);
  }).catch((e) => {
    injectPromise = null;
    sdkRunDone = false;
    throw e;
  });

  return injectPromise;
}

async function waitForChatwootApi(maxMs = 12000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (typeof window !== "undefined" && window.$chatwoot) return true;
    await new Promise((r) => setTimeout(r, 40));
  }
  return Boolean(typeof window !== "undefined" && window.$chatwoot);
}

export async function ensureChatwootLoaded(): Promise<boolean> {
  if (!isChatwootConfigured()) return false;
  try {
    await ensureScriptInjected();
    return await waitForChatwootApi();
  } catch {
    return false;
  }
}

export function chatwootSetBubbleVisible(visible: boolean): void {
  const w = window.$chatwoot;
  if (!w) return;
  w.toggleBubbleVisibility(visible ? "show" : "hide");
}

export function chatwootReset(): void {
  const w = window.$chatwoot;
  if (!w?.reset) return;
  try {
    w.reset();
  } catch {
    /* ignore */
  }
}

export type ChatwootTenantPayload = {
  user: { id: number; email: string; name?: string };
  customAttributes: Record<string, string | number | boolean>;
};

export async function chatwootApplyTenantSession(payload: ChatwootTenantPayload): Promise<void> {
  const ok = await ensureChatwootLoaded();
  if (!ok) return;
  const w = window.$chatwoot;
  if (!w) return;
  try {
    w.setUser(`emplyon-user-${payload.user.id}`, {
      email: payload.user.email,
      name: payload.user.name?.trim() || payload.user.email,
    });
  } catch {
    /* ignora — inbox pode rejeitar formato */
  }
  try {
    w.setCustomAttributes(payload.customAttributes);
  } catch {
    /* atributos não criados no Chatwoot podem falhar; o bubble deve aparecer na mesma */
  }
  try {
    w.toggleBubbleVisibility("show");
  } catch {
    /* ignore */
  }
}
