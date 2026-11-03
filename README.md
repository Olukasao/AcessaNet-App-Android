# Central do Assinante Mobile (AcessaNet)

App Android (Capacitor 8 + React) da Central do Assinante. Reaproveita `../acessanet-lab/src/cliente`
(telas, API e CSS) via alias `@site`, sem copiar código e sem alterar o site.

- Nome: AcessaNet · pacote: `br.com.acessanet.portal` (o mesmo cadastrado na Play Console; não muda depois de publicado)
- API: `https://acessanet.com.br` (mude com `VITE_ACESSANET_API_URL`). O app não leva nenhum segredo; só o que a Central já usa.
- Tokens da sessão ficam no Android Keystore (`src/native/secureTokens.js`).
- Links externos (boleto, PIX, WhatsApp) abrem em Chrome Custom Tabs, só https.
- Botão Voltar, status bar, teclado, splash e aviso de offline: `src/native/NativeShell.jsx`.

## Clonar e compilar
O app importa o código da Central do repositório do site. Clone os dois **lado a lado**:
```
git clone git@github.com:Olukasao/SiteAcessaNetV2.git acessanet-lab   # branch feat/contratacao-online
git clone git@github.com:Olukasao/AcessaNet-App-Android.git
cd acessanet-lab && npm ci && cd ../AcessaNet-App-Android && npm ci
```
Não vão para o git (cada máquina tem os seus): `android/keystore.properties` e a chave de assinatura, `android/app/google-services.json`, `.env`.

## Ambiente de build (já instalado nesta máquina)
```
export JAVA_HOME=/home/noc/android-toolchain/jdk
export ANDROID_HOME=/home/noc/android-toolchain/sdk
export PATH=$JAVA_HOME/bin:$PATH
```

## Gerar nova versão
1. Aumente `versionCode`/`versionName` em `android/app/build.gradle`.
2. `npm run android:debug` → `android/app/build/outputs/apk/debug/app-debug.apk`
3. Ícone/splash: edite `scripts/make-brand-assets.mjs`, rode `node scripts/make-brand-assets.mjs && npx capacitor-assets generate --android`.

## Release assinado e Google Play
1. Crie a chave (guarde fora do git e faça backup):
   `keytool -genkeypair -v -keystore acessanet-release.jks -alias acessanet -keyalg RSA -keysize 2048 -validity 10000`
2. Crie `android/keystore.properties` (já ignorado pelo git) com `storeFile`, `storePassword`, `keyAlias`, `keyPassword`.
3. `npm run android:release` (APK) ou `npm run android:bundle` (AAB para a Play, em `android/app/build/outputs/bundle/release/`).

## Segurança e privacidade (resumo)
- Links externos: só `acessanet.com.br` (e subdomínios), `acessanet.sgp.net.br` e `wa.me` (`src/native/externalLinks.js`). Outro domínio do gateway de pagamento precisa ser acrescentado ali de propósito.
- CSP no build (`vite.config.js`): conexões só com `https://acessanet.com.br`; sem scripts inline.
- Release com minify/R8 (`android/app/build.gradle`, regras em `proguard-rules.pro`); guarde o `mapping.txt` de cada versão publicada.
- LGPD: link da Política de Privacidade no login e no Perfil; "Excluir minha conta e dados" abre e-mail para `contato@acessanet.com` (canal da página /lgpd do site). Na Play Console, informe https://acessanet.com.br/lgpd como política e como URL de exclusão de conta.
- Git: repositório local, sem chaves nem builds (`.gitignore`). A keystore de upload deve ficar fora da pasta do projeto.
