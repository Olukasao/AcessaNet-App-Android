import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { getApiBaseUrl } from "@site/cliente/clienteApi";

const AppUpdate = registerPlugin("AppUpdate");
const CHECK_TIMEOUT_MS = 8000;
const LOGIN_PATH = "/cliente/login";

/**
 * Atualização obrigatória: o servidor informa a versão mínima aceita (GET /v1/app/version) e, se o código
 * instalado for menor, a tela inteira pede para atualizar na Play. Confere ao abrir o app e ao sair do login.
 * Qualquer falha (sem rede, servidor fora do ar, resposta estranha) deixa o app abrir normalmente: um problema
 * nosso nunca pode trancar os clientes para fora.
 */
export default function ForceUpdateGate() {
  const location = useLocation();
  // Só para revisar o visual no servidor local (?preview-force=1); nunca vale no build de produção.
  const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview-force") === "1";
  const [required, setRequired] = useState(preview);
  const checking = useRef(false);
  const lastPath = useRef(null);

  const check = useCallback(async () => {
    if (preview || !Capacitor.isNativePlatform() || checking.current) return;
    checking.current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    try {
      const [{ build }, response] = await Promise.all([
        CapApp.getInfo(),
        fetch(`${getApiBaseUrl()}/v1/app/version`, { signal: controller.signal, headers: { Accept: "application/json" } })
      ]);
      if (!response.ok) return;
      const { minVersionCode } = await response.json();
      const installed = Number.parseInt(build, 10);
      if (Number.isFinite(installed) && Number.isFinite(minVersionCode) && minVersionCode > 0 && installed < minVersionCode) {
        setRequired(true);
      }
    } catch {
      // Falha silenciosa de propósito (ver comentário do componente).
    } finally {
      clearTimeout(timer);
      checking.current = false;
    }
  }, [preview]);

  useEffect(() => {
    void check();
  }, [check]);

  // Depois de entrar na conta (saiu da tela de login), confere de novo.
  useEffect(() => {
    const previous = lastPath.current;
    lastPath.current = location.pathname;
    if (previous === LOGIN_PATH && location.pathname !== LOGIN_PATH) void check();
  }, [location.pathname, check]);

  // Atualização imediata da Play (tela cheia, instala e reabre o app). Se a Play não oferecer, abre a página na loja.
  const update = useCallback(async () => {
    try {
      await AppUpdate.startImmediate();
    } catch {
      await AppUpdate.openStore().catch(() => {});
    }
  }, []);

  // Voltou da Play com a atualização imediata interrompida: retoma, em vez de deixar o cliente preso na tela.
  useEffect(() => {
    if (!required) return undefined;
    const onResume = async () => {
      try {
        const result = await AppUpdate.check();
        if (result.inProgress === true) await AppUpdate.startImmediate();
      } catch {
        // Sem Play: o botão continua levando à loja.
      }
    };
    window.addEventListener("acessanet:resume", onResume);
    return () => window.removeEventListener("acessanet:resume", onResume);
  }, [required]);

  if (!required) return null;

  return (
    <div className="force-update" role="alertdialog" aria-modal="true" aria-labelledby="force-update-title">
      <div className="force-update-card">
        <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" />
        </svg>
        <h2 id="force-update-title">Atualização necessária</h2>
        <p>Para continuar usando o app da AcessaNet, instale a versão mais recente na Google Play.</p>
        <button className="force-update-action" type="button" onClick={() => void update()}>
          Atualizar agora
        </button>
      </div>
    </div>
  );
}
