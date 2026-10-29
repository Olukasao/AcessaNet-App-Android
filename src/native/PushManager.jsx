import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { clienteRequest, getApiBaseUrl, readTokens } from "@site/cliente/clienteApi.js";

const TOKEN_KEY = "acessanet.push.token";
const CHANNELS = [
  { id: "chamados", name: "Chamados e visitas", description: "Avisos sobre os seus atendimentos, como a data e a hora da visita técnica" },
  { id: "faturas", name: "Faturas e pagamentos", description: "Avisos sobre faturas vencidas" }
];
// Telas que uma notificação pode abrir (o servidor manda a rota; qualquer outra coisa é ignorada).
const ALLOWED_ROUTES = new Set(["/cliente/chamados", "/cliente/faturas"]);

function savedToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
function saveToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // sem armazenamento: o token é pedido de novo na próxima abertura
  }
}

function showToast(text) {
  const el = document.createElement("div");
  el.className = "app-toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 6000);
}

/**
 * Avisos no celular (notificações do Android) sobre os chamados, por exemplo "Visita técnica agendada".
 * O servidor decide quando avisar; aqui o app só pede permissão, entrega o endereço do aparelho (token FCM) e abre
 * a tela de chamados quando a pessoa toca na notificação.
 */
export default function PushManager() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("PushNotifications")) return undefined;

    let contractIds = [];
    const handles = [];
    const track = (promise) => promise.then((h) => handles.push(h)).catch(() => {});

    async function registerDevice(token) {
      const { accessToken } = readTokens();
      if (!accessToken || accessToken.startsWith("demo-")) return; // modo demonstração não recebe aviso
      let appVersion = "";
      try {
        appVersion = (await CapApp.getInfo()).version;
      } catch {
        // versão é opcional
      }
      try {
        await clienteRequest("/v1/push/devices", {
          method: "POST",
          body: { token, platform: "android", appVersion, contractIds }
        });
      } catch {
        // servidor sem a função ainda, ou sem rede: tenta de novo na próxima abertura
      }
    }

    async function setup() {
      const { accessToken } = readTokens();
      if (!accessToken || accessToken.startsWith("demo-")) return;
      try {
        let status = (await PushNotifications.checkPermissions()).receive;
        if (status === "prompt" || status === "prompt-with-rationale") {
          status = (await PushNotifications.requestPermissions()).receive;
        }
        if (status !== "granted") return;
        for (const channel of CHANNELS) {
          await PushNotifications.createChannel({ ...channel, importance: 4, visibility: 1, vibration: true });
        }
        await PushNotifications.register();
      } catch {
        // Firebase ainda não configurado neste build (sem google-services.json): o app segue normal, sem avisos
      }
    }

    track(
      PushNotifications.addListener("registration", (result) => {
        saveToken(result.value);
        void registerDevice(result.value);
      })
    );
    track(PushNotifications.addListener("registrationError", () => {}));
    // App aberto: o Android não mostra a notificação sozinho, então mostra um aviso na tela.
    track(
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        const text = [notification.title, notification.body].filter(Boolean).join(": ");
        if (text) showToast(text);
        window.dispatchEvent(new Event("acessanet:push-received"));
      })
    );
    // Tocou na notificação: abre a tela do aviso (chamados ou faturas).
    track(
      PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        const route = action?.notification?.data?.route;
        window.location.hash = `#${ALLOWED_ROUTES.has(route) ? route : "/cliente/chamados"}`;
      })
    );

    const onAuthenticated = (event) => {
      contractIds = Array.isArray(event.detail?.contractIds) ? event.detail.contractIds.map(String) : [];
      void setup();
    };
    // Ao sair da conta, o aparelho deixa de receber os avisos dessa pessoa (precisa do token ainda válido).
    const onLoggingOut = (event) => {
      const accessToken = event.detail?.accessToken;
      const token = savedToken();
      if (accessToken && token) {
        void fetch(`${getApiBaseUrl()}/v1/push/devices`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        }).catch(() => {});
      }
      saveToken("");
      void PushNotifications.unregister().catch(() => {});
    };
    window.addEventListener("acessanet:authenticated", onAuthenticated);
    window.addEventListener("acessanet:logging-out", onLoggingOut);

    return () => {
      window.removeEventListener("acessanet:authenticated", onAuthenticated);
      window.removeEventListener("acessanet:logging-out", onLoggingOut);
      handles.forEach((h) => h.remove());
    };
  }, []);

  return null;
}
