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
import { Capacitor } from "@capacitor/core";
import "./app.css";
import "./mobile-polish.css";

async function start() {
  // Web em tela grande: mostra o app dentro de um quadro de celular.
  if (!Capacitor.isNativePlatform() && window.self === window.top && window.innerWidth >= 600 && !location.search.includes("full")) {
    document.documentElement.classList.add("web-frame");
    createRoot(document.getElementById("root")).render(<iframe className="web-frame-device" title="AcessaNet" src={location.href} />);
    return;
  }

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

void start();
