import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

const AppUpdate = registerPlugin("AppUpdate");

/** Avisa quando a Play Store oferece uma versão mais nova e leva a pessoa direto para a atualização. */
export default function AppUpdateNotice() {
  // A consulta real só funciona em um app instalado pela Play Store. Este parâmetro
  // permite revisar o visual no servidor local sem interferir no build de produção.
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview-update") === "1";
  const [available, setAvailable] = useState(preview);
  const [dismissed, setDismissed] = useState(false);
  // "available" -> toque -> "downloading" (Play baixa em segundo plano) -> "ready" (falta reiniciar).
  const [phase, setPhase] = useState("available");
  const checking = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (preview) return;
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("AppUpdate") || checking.current) return;
    checking.current = true;
    try {
      const result = await AppUpdate.check();
      setAvailable(result.available === true || result.downloaded === true);
      if (result.downloaded === true) setPhase("ready");
    } catch {
      // Sem Google Play, sem rede ou build instalado fora da loja: o app continua normalmente.
    } finally {
      checking.current = false;
    }
  }, [preview]);

  useEffect(() => {
    void checkForUpdate();
    const onResume = () => void checkForUpdate();
    window.addEventListener("acessanet:resume", onResume);
    return () => window.removeEventListener("acessanet:resume", onResume);
  }, [checkForUpdate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("AppUpdate")) return undefined;
    const handle = AppUpdate.addListener("updateDownloaded", () => {
      setAvailable(true);
      setDismissed(false);
      setPhase("ready");
    });
    return () => void handle.then((h) => h.remove()).catch(() => {});
  }, []);

  // Baixa pela própria Play sem sair do app; se a Play não oferecer esse modo, abre a página do app na loja.
  async function handleAction() {
    if (phase === "ready") {
      await AppUpdate.completeUpdate().catch(() => {});
      return;
    }
    try {
      await AppUpdate.startFlexible();
      setPhase("downloading");
    } catch {
      // Sem a Play (navegador, app fora da loja) a página da loja também não abre: não é erro para mostrar.
      await AppUpdate.openStore().catch(() => {});
    }
  }

  if (!available || dismissed) return null;

  const label = phase === "ready" ? "Reiniciar para atualizar" : phase === "downloading" ? "Baixando atualização..." : "Atualização disponível";

  return (
    <div className="app-update-pill" role="status">
      <button className="app-update-action" type="button" disabled={phase === "downloading"} onClick={() => void handleAction()}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" />
        </svg>
        {label}
      </button>
      <button className="app-update-close" type="button" aria-label="Dispensar aviso de atualização" onClick={() => setDismissed(true)}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>
  );
}
