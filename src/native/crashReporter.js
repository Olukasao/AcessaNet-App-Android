import { App as CapApp } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { getApiBaseUrl } from "@site/cliente/clienteApi.js";

// Relatório de erros do app -> POST /v1/app-crashes (sem login: o app pode quebrar antes do login).
// Envia só: tipo, mensagem, pilha, versão do app, modelo/Android e um ID anônimo gerado aqui.
// Nunca envia CPF, tokens nem o conteúdo das telas; o servidor ainda filtra e-mails e números longos.
const CrashReport = registerPlugin("CrashReport");
const DEVICE_KEY = "acessanet.crash.deviceId";
const MAX_PER_SESSION = 5;
const IGNORED_MESSAGES = [/ResizeObserver loop/i, /^Script error\.?$/i, /Load failed|Failed to fetch|NetworkError/i];

let sent = 0;
const seen = new Set();
let versionPromise;

function deviceId() {
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = window.crypto.randomUUID();
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `sessao-${Math.random().toString(16).slice(2, 12)}`;
  }
}

function appVersion() {
  versionPromise ??= CapApp.getInfo().then((info) => info.version || "desconhecida").catch(() => "desconhecida");
  return versionPromise;
}

/** "Android 14; Pixel 7 Build/..." do user agent da WebView. */
function deviceFromUserAgent() {
  const match = navigator.userAgent.match(/Android\s([\d.]+);\s([^;)]+?)(?:\sBuild|[;)])/);
  return { androidVersion: match?.[1] || "desconhecido", deviceModel: match?.[2]?.trim() || "desconhecido" };
}

async function send(report) {
  const response = await fetch(`${getApiBaseUrl()}/v1/app-crashes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: report.kind,
      message: String(report.message || "Erro sem mensagem").slice(0, 2000),
      stack: String(report.stack || "").slice(0, 12000),
      appVersion: (await appVersion()).slice(0, 32),
      deviceId: deviceId(),
      deviceModel: String(report.deviceModel || deviceFromUserAgent().deviceModel).slice(0, 100),
      androidVersion: String(report.androidVersion || deviceFromUserAgent().androidVersion).slice(0, 32),
      ...(report.occurredAt ? { occurredAt: report.occurredAt } : {})
    }),
    keepalive: true
  });
  return response.ok;
}

/** Erros de tela: poucos por sessão e sem repetir o mesmo; qualquer falha de envio é ignorada. */
function reportJs(error, fallbackMessage) {
  try {
    const message = error?.message || fallbackMessage || "Erro sem mensagem";
    if (IGNORED_MESSAGES.some((pattern) => pattern.test(message))) return;
    const stack = error?.stack || "";
    const key = `${message}|${stack.split("\n").slice(0, 3).join("|")}`;
    if (seen.has(key) || sent >= MAX_PER_SESSION) return;
    seen.add(key);
    sent += 1;
    void send({ kind: "js", message: `${error?.name || "Error"}: ${message}`, stack }).catch(() => {});
  } catch {
    // o relatório nunca pode causar outro erro
  }
}

/** Envia o erro nativo gravado na abertura anterior e só apaga o arquivo se o servidor aceitou. */
async function flushNativeCrash() {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("CrashReport")) return;
  try {
    const { crash } = await CrashReport.getPending();
    if (!crash) return;
    if (await send(crash)) await CrashReport.clear();
  } catch {
    // tenta de novo na próxima abertura
  }
}

export function installCrashReporter() {
  window.addEventListener("error", (event) => reportJs(event.error, event.message));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    // Erros da API (ClienteApiError) e cancelamentos são parte do fluxo normal, não defeitos do app.
    if (reason?.name === "ClienteApiError" || reason?.name === "AbortError") return;
    reportJs(reason instanceof Error ? reason : new Error(String(reason)), "Promessa rejeitada");
  });
  // Falhas de renderização capturadas pelo RouteErrorBoundary do site.
  window.addEventListener("acessanet:render-error", (event) => reportJs(event.detail, "Falha ao renderizar"));
  // Espera um pouco: não disputa banda com a abertura do app.
  window.setTimeout(() => void flushNativeCrash(), 5000);
}
