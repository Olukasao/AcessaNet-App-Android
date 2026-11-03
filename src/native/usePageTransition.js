import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Telas das abas da barra inferior: trocar entre elas sobe suavemente (fade); entrar numa tela de dentro desliza
// da direita e voltar desliza da esquerda, como no Android nativo.
const TABS = new Set([
  "/cliente",
  "/cliente/inicio",
  "/cliente/faturas",
  "/cliente/atendimento",
  "/cliente/chamados",
  "/cliente/internet",
  "/cliente/plano",
  "/cliente/perfil"
]);
const normalize = (path) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SLIDE = "26px";

export function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Anima o conteúdo da Central a cada troca de tela (opacity + translate, sem custo de layout). */
export default function usePageTransition() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(null);
  const running = useRef(null);

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    if (from === null || from === pathname) return;
    if (reducedMotion() || typeof Element === "undefined" || !Element.prototype.animate) return;

    const content = document.querySelector(".cliente-content");
    if (!content) return;

    const a = normalize(from);
    const b = normalize(pathname);
    let from_;
    if (TABS.has(a) && TABS.has(b)) from_ = { opacity: 0, translate: "0 12px" };
    else if (navigationType === "POP") from_ = { opacity: 0, translate: `-${SLIDE} 0` };
    else from_ = { opacity: 0, translate: `${SLIDE} 0` };

    running.current?.cancel();
    running.current = content.animate([from_, { opacity: 1, translate: "0 0" }], { duration: 300, easing: EASE });
  }, [pathname, navigationType]);
}
