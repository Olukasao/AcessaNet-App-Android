import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import PushManager from "./PushManager.jsx";

const ROOT_PATHS = ["/cliente", "/cliente/", "/cliente/login", "/cliente/inicio"];

/** Botão Voltar do Android, status bar, teclado, splash e aviso de falta de internet. */
export default function NativeShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: "#050b1f" }).catch(() => {});
    void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});

    const handles = [];
    const track = (promise) => promise.then((h) => handles.push(h)).catch(() => {});
    track(Network.addListener("networkStatusChange", (s) => setOnline(s.connected)));
    // Voltou para o app (saiu e entrou): a Central atualiza chamados e agendamento na hora.
    track(CapApp.addListener("appStateChange", (state) => {
      if (state.isActive) window.dispatchEvent(new Event("acessanet:resume"));
    }));
    track(CapApp.addListener("resume", () => window.dispatchEvent(new Event("acessanet:resume"))));
    void Network.getStatus().then((s) => setOnline(s.connected)).catch(() => {});
    track(Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
      document.documentElement.classList.add("keyboard-open");
    }));
    track(Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      document.documentElement.classList.remove("keyboard-open");
    }));
    return () => handles.forEach((h) => h.remove());
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let handle;
    void CapApp.addListener("backButton", () => {
      const open = document.querySelector('[role="dialog"] button[aria-label*="echar"], .cliente-scrim');
      if (open instanceof HTMLElement) {
        open.click();
        return;
      }
      if (ROOT_PATHS.includes(location.pathname)) void CapApp.minimizeApp();
      else navigate(-1);
    }).then((h) => { handle = h; });
    return () => handle?.remove();
  }, [location.pathname, navigate]);

  return (
    <>
      <PushManager />
      {children}
      {online ? null : (
        <div className="app-offline-banner" role="status">Sem conexão com a internet. Verifique sua rede.</div>
      )}
    </>
  );
}
