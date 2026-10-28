import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const SAFE_PROTOCOLS = new Set(["https:", "http:"]);
const SYSTEM_PROTOCOLS = new Set(["tel:", "mailto:"]);

// Só domínios que o sistema já usa: o site/central da AcessaNet (e subdomínios), o SGP (boleto, PIX, assinatura) e o WhatsApp.
// Se um boleto/PIX abrir outro domínio do gateway de pagamento, ele precisa ser acrescentado aqui de propósito.
const ALLOWED_SUFFIXES = ["acessanet.com.br"];
const ALLOWED_EXACT = new Set(["acessanet.sgp.net.br", "wa.me"]);

export function isAllowedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return ALLOWED_EXACT.has(host) || ALLOWED_SUFFIXES.some((base) => host === base || host.endsWith(`.${base}`));
}

function isExternal(url) {
  return url.origin !== window.location.origin;
}

function showBlockedNotice() {
  const el = document.createElement("div");
  el.className = "app-toast";
  el.setAttribute("role", "alert");
  el.textContent = "Este link não pôde ser aberto por segurança.";
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 4000);
}

export async function openExternal(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl, window.location.href);
  } catch {
    return;
  }
  if (SYSTEM_PROTOCOLS.has(url.protocol)) {
    window.location.href = url.href;
    return;
  }
  // Só https e só domínios da lista; nada de javascript:, file:, intent: etc.
  if (url.protocol !== "https:") return;
  if (!isAllowedHost(url.hostname)) {
    showBlockedNotice();
    return;
  }
  if (Capacitor.isNativePlatform()) await Browser.open({ url: url.href });
  else window.open(url.href, "_blank", "noopener,noreferrer");
}

/** Links externos (boleto, PIX, WhatsApp, assinatura) abrem em Chrome Custom Tabs, só nos domínios permitidos. */
export function installExternalLinks() {
  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (!SAFE_PROTOCOLS.has(url.protocol) && !SYSTEM_PROTOCOLS.has(url.protocol)) {
        event.preventDefault();
        return;
      }
      if (isExternal(url)) {
        event.preventDefault();
        void openExternal(url.href);
      }
    },
    true
  );

  window.open = (url) => {
    if (!url) return null;
    void openExternal(String(url));
    return null;
  };
}
