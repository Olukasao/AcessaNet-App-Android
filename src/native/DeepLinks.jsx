import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Atalhos do ícone (pressionar e segurar) abrem acessanet://app/<destino>.
// Só estes três destinos existem; qualquer outro link é ignorado (o esquema pode ser chamado por outros apps e sites).
const ROUTES = {
  faturas: "/cliente/faturas",
  chamado: "/cliente/atendimento",
  wifi: "/cliente/atendimento?categoria=router_password"
};

export function routeForUrl(url) {
  const match = /^acessanet:\/\/app\/(faturas|chamado|wifi)\/?$/.exec(String(url || ""));
  return match ? ROUTES[match[1]] : null;
}

export default function DeepLinks() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let handle;
    const open = (url) => {
      const route = routeForUrl(url);
      if (route) window.location.hash = `#${route}`;
    };

    // App fechado: o link que o abriu.
    CapApp.getLaunchUrl()
      .then((launch) => open(launch?.url))
      .catch(() => {});
    // App aberto ou em segundo plano.
    CapApp.addListener("appUrlOpen", (event) => open(event.url))
      .then((h) => {
        handle = h;
      })
      .catch(() => {});

    return () => handle?.remove();
  }, []);

  return null;
}
