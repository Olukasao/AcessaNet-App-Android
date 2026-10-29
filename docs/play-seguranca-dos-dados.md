# Play Console: Segurança dos dados (Data safety) — AcessaNet

Baseado no que o app faz hoje (versão 1.0.4). Revise com o encarregado de dados (LGPD) antes de enviar: o formulário é uma declaração da empresa à Google.

## 1. Perguntas iniciais
- O app coleta ou compartilha algum dos tipos de dados exigidos? **Sim**
- Todos os dados do usuário são criptografados em trânsito? **Sim** (HTTPS obrigatório; o app não aceita conexão sem HTTPS)
- Você oferece uma forma de os usuários pedirem a exclusão dos dados? **Sim**
  - URL: `https://acessanet.com.br/excluir-conta`
  - No app: Perfil > "Excluir minha conta e dados" (abre um e-mail para contato@acessanet.com)

## 2. Tipos de dados coletados

| Categoria | Tipo | Obrigatório? | Finalidade |
|---|---|---|---|
| Informações pessoais | Nome | Obrigatório | Funcionalidade do app; Gerenciamento de conta |
| Informações pessoais | Endereço de e-mail | Obrigatório | Funcionalidade do app; Gerenciamento de conta |
| Informações pessoais | Número de telefone | Obrigatório | Funcionalidade do app; Gerenciamento de conta |
| Informações pessoais | Endereço (instalação do serviço) | Obrigatório | Funcionalidade do app |
| Informações pessoais | IDs do usuário (CPF/CNPJ e senha de acesso) | Obrigatório | Funcionalidade do app; Gerenciamento de conta; Segurança e prevenção de fraude |
| Informações financeiras | Outras informações financeiras (faturas, vencimentos, código Pix; **sem dados de cartão**) | Obrigatório | Funcionalidade do app |
| Mensagens | Outras mensagens no app (descrição do problema e chat com o atendimento) | **Opcional** (só quem abre atendimento) | Funcionalidade do app |
| Atividade no app | Interações no app (telas vistas; copiar Pix/código de barras) | Obrigatório | Funcionalidade do app; Análises |
| ID do dispositivo ou outros IDs | Token de notificações (Firebase Cloud Messaging) | **Opcional** (só se a pessoa permitir notificações) | Funcionalidade do app (avisos de visita e de fatura) |

Nome, e-mail, telefone, endereço e dados financeiros chegam ao app a partir do cadastro da empresa; declaramos de forma conservadora porque o app os trata como parte da conta do assinante.

**Não coletados:** localização, contatos, fotos e vídeos, áudio, arquivos, calendário, saúde, histórico de navegação, mensagens SMS, dados de falhas/diagnóstico (o app não usa SDK de análise de falhas).

## 3. Compartilhamento
Responder **"Não"** para compartilhamento de todos os tipos, com esta justificativa interna:
- Google (Firebase Cloud Messaging): entrega a notificação; atua como prestador de serviço em nome da AcessaNet.
- SGP/TSMX: sistema de gestão de clientes da AcessaNet; também prestador de serviço.
- A Play não considera "compartilhamento" a transferência a prestadores que tratam os dados em nome da empresa.
- Links externos (boleto, Pix, WhatsApp) abrem fora do app por ação da pessoa e não são envio de dados pelo app.

## 4. Segurança
- Criptografia em trânsito: Sim.
- Senha guardada com hash no servidor; tokens de sessão guardados no Android Keystore.
- Sem anúncios, sem venda de dados, sem público infantil.

## 5. Exclusão de dados (seção "Exclusão de conta" da Play)
- URL do recurso de exclusão: `https://acessanet.com.br/excluir-conta` (a política de privacidade continua em `https://acessanet.com.br/lgpd`)
- O que é apagado: a conta do app e os dados pessoais que a empresa não precisa guardar por lei. O contrato de internet não é cancelado por isso. (Confirmar com o jurídico o que deve ser retido por obrigação legal.)

## 6. Texto sugerido para a Política de Privacidade (página /lgpd do site)
> **Aplicativo AcessaNet (Android).** Ao usar o aplicativo, tratamos seu CPF/CNPJ e senha para identificar você; seu nome, e-mail, telefone, endereço, contrato, faturas e chamados para mostrar as informações do seu serviço; e o histórico das telas acessadas para melhorar o atendimento. Se você permitir notificações, guardamos um identificador do seu aparelho (token de notificações do Firebase, da Google) apenas para avisar sobre visitas técnicas agendadas e faturas vencidas; você pode desativar as notificações a qualquer momento nas configurações do Android, e o identificador deixa de ser usado quando você sai da conta. Não coletamos sua localização, contatos, fotos nem dados de cartão. Seus dados trafegam criptografados e são tratados por prestadores que atuam em nosso nome (como a Google, para entrega das notificações), sem venda de dados. Para consultar, corrigir ou excluir seus dados, use o botão "Excluir minha conta e dados" no Perfil do aplicativo ou escreva para contato@acessanet.com.

## 7. Antes de enviar
- A política de privacidade publicada precisa ter o parágrafo acima (a Google confere se a política bate com a declaração).
- Se o app passar a usar localização, câmera, análise de falhas ou outro SDK, atualize esta declaração antes de publicar a nova versão.
