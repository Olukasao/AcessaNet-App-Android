import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { openExternal } from "./externalLinks.js";

const PRIVACY_URL = "https://acessanet.com.br/lgpd";
const PRIVACY_EMAIL = "contato@acessanet.com";

/** Rodapé do login: política de privacidade. */
export function LoginFooter() {
  return (
    <p className="app-legal">
      Ao entrar, você concorda com o tratamento dos seus dados conforme a{" "}
      <button type="button" className="app-link" onClick={() => void openExternal(PRIVACY_URL)}>
        Política de Privacidade
      </button>
      .
    </p>
  );
}

/** Perfil: política de privacidade e pedido de exclusão da conta e dos dados (LGPD). */
export function ProfileExtras({ customer }) {
  function requestDeletion() {
    const ok = window.confirm(
      "Excluir minha conta e meus dados?\n\nVamos abrir um e-mail para a AcessaNet com o seu pedido. Depois de confirmarmos que é você, a conta do app e os dados pessoais que não precisamos guardar por lei são apagados. Seu contrato de internet não é cancelado por isso."
    );
    if (!ok) return;
    const subject = "Solicitação de exclusão de conta e dados (LGPD)";
    const body = [
      "Olá, quero excluir minha conta do app AcessaNet e os meus dados pessoais.",
      "",
      `Nome: ${customer?.name || ""}`,
      `CPF/CNPJ: ${customer?.maskedCpf || ""}`,
      "",
      "Para confirmar que sou eu, respondo a este e-mail com os dados que forem pedidos."
    ].join("\n");
    void openExternal(`mailto:${PRIVACY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }

  return (
    <section className="cliente-panel app-privacy">
      <h3>Privacidade e seus dados</h3>
      <p className="app-privacy-text">Seus dados são tratados conforme a LGPD. Você pode consultar como usamos suas informações ou pedir a exclusão.</p>
      <button type="button" className="app-privacy-row" onClick={() => void openExternal(PRIVACY_URL)}>
        <FileText size={18} aria-hidden="true" />
        <span>Política de Privacidade</span>
        <ExternalLink size={16} aria-hidden="true" />
      </button>
      <button type="button" className="app-privacy-row app-privacy-danger" onClick={requestDeletion}>
        <Trash2 size={18} aria-hidden="true" />
        <span>Excluir minha conta e dados</span>
      </button>
    </section>
  );
}
