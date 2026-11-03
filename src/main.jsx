import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "@fontsource-variable/sora";
import "@fontsource-variable/manrope";
import "@site/styles/tokens.css";
import "@site/styles/base.css";
import ClienteArea from "@site/cliente/ClienteArea.jsx";
import { AppExtrasContext, LoginBackdropContext } from "@site/cliente/homeHeroSlot.js";
import LoginPlanet from "./home/LoginPlanet.jsx";
import { LoginFooter, ProfileExtras } from "./native/AppExtras.jsx";

const appExtras = { LoginFooter, ProfileExtras };
import RouteErrorBoundary from "@site/components/RouteErrorBoundary.jsx";
import NativeShell from "./native/NativeShell.jsx";
import { installSecureTokenStorage } from "./native/secureTokens.js";
import { installExternalLinks } from "./native/externalLinks.js";
import { installCrashReporter } from "./native/crashReporter.js";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import "./app.css";
import "./mobile-polish.css";
import "./motion.css";

async function start() {
  // Web em tela grande: mostra o app dentro de um quadro de celular.
  if (!Capacitor.isNativePlatform() && window.self === window.top && window.innerWidth >= 600 && !location.search.includes("full")) {
    document.documentElement.classList.add("web-frame");
    createRoot(document.getElementById("root")).render(<iframe className="web-frame-device" title="AcessaNet" src={location.href} />);
    return;
  }

  installCrashReporter();
  await installSecureTokenStorage();
  installExternalLinks();

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <HashRouter>
        <RouteErrorBoundary>
          <NativeShell>
            <Routes>
              <Route path="/cliente/*" element={<AppExtrasContext.Provider value={appExtras}><LoginBackdropContext.Provider value={LoginPlanet}><ClienteArea /></LoginBackdropContext.Provider></AppExtrasContext.Provider>} />
              {/* O app abre direto na Central; nunca mostra o site institucional. */}
              <Route path="*" element={<Navigate to="/cliente" replace />} />
            </Routes>
          </NativeShell>
        </RouteErrorBoundary>
      </HashRouter>
    </StrictMode>
  );
}

// A splash só some quando a tela monta (NativeShell). Se algo falhar ao iniciar, ela não pode ficar presa para sempre:
// mostra uma mensagem com botão para tentar de novo e libera a tela.
function showStartupError() {
  const root = document.getElementById("root");
  if (root && !root.hasChildNodes()) {
    root.innerHTML =
      '<div style="min-height:100dvh;display:grid;place-items:center;padding:24px;background:#050b1f;color:#fff;font-family:system-ui,sans-serif;text-align:center">' +
      '<div><p style="font-size:1.1rem;margin:0 0 16px">Não foi possível abrir o aplicativo agora.</p>' +
      '<button id="retry" style="min-height:48px;padding:0 24px;border:0;border-radius:999px;background:#2a66f6;color:#fff;font-size:1rem;font-weight:700">Tentar de novo</button></div></div>';
    document.getElementById("retry")?.addEventListener("click", () => window.location.reload());
  }
  void SplashScreen.hide().catch(() => {});
}

start().catch(showStartupError);
if (Capacitor.isNativePlatform()) {
  // Rede de segurança: depois de 8 s a splash sai de qualquer jeito.
  window.setTimeout(() => void SplashScreen.hide().catch(() => {}), 8000);
}
