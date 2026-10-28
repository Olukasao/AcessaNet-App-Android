# Central do Assinante Mobile (AcessaNet)

App Android (Capacitor 8 + React) da Central do Assinante. Reaproveita `../acessanet-lab/src/cliente`
(telas, API e CSS) via alias `@site`, sem copiar código e sem alterar o site.

- Nome: AcessaNet · pacote provisório: `br.com.acessanet.assinante` (trocar em `capacitor.config.json` e `android/app/build.gradle` antes de publicar)
- API: `https://acessanet.com.br` (mude com `VITE_ACESSANET_API_URL`). O app não leva nenhum segredo; só o que a Central já usa.
- Tokens da sessão ficam no Android Keystore (`src/native/secureTokens.js`).
- Links externos (boleto, PIX, WhatsApp) abrem em Chrome Custom Tabs, só https.
- Botão Voltar, status bar, teclado, splash e aviso de offline: `src/native/NativeShell.jsx`.

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
