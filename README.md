# Meteor

![Version](https://img.shields.io/badge/version-6.0.0-ff6b3d.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Flutter](https://img.shields.io/badge/Flutter-3.47-54c5f8.svg)
![Node](https://img.shields.io/badge/Node-22-5fa04e.svg)

Meteor é um painel de inteligência climática com uma experiência web responsiva
e um aplicativo Android nativo. A versão 6 reconstrói a interface, melhora os
insights locais, endurece o backend e separa com clareza o que pertence à web do
que pertence ao Android.

- Aplicação web: <https://meteor-ai.netlify.app>
- Código estável web/BFF: branch `main`
- Aplicativo Flutter e releases Android: branch `android`

## O que existe hoje

### Web

- clima atual, previsão horária e diária, qualidade do ar e alertas oficiais;
- painel responsivo, modo Zen, tema escuro e modo AMOLED;
- fotos meteorológicas do Unsplash com crédito e fallback para Picsum Photos;
- mapa Leaflet com camadas meteorológicas;
- notícias com cache e fallback controlado;
- assistente Meteor AI com contexto climático e grounding do Google quando
  necessário;
- resumo inteligente determinístico para riscos de chuva, tempestade, calor,
  frio, UV, vento, visibilidade e qualidade do ar;
- PWA apenas para cache do shell. A web não solicita nem oferece notificações
  push, e-mail ou SMS.

### Android

O app oficial fica em `mobile/` na branch `android` e usa Flutter, Material 3 e
Material You. Inclui Home em cards, mapa, notícias, IA, configurações, tema AMOLED
preto real, cache local, localização somente enquanto o app está em uso e push
nativo opcional via Firebase Cloud Messaging.

O Android nunca recebe chaves de OpenWeather, Gemini, GNews ou Unsplash. Ele
consome o mesmo BFF server-side da web. A configuração pública do Firebase é
separada das credenciais privadas de Firebase Admin e de assinatura do APK.

## Arquitetura

```text
Web React ───────────────┐
                        ├─> Netlify Functions/BFF ─> provedores externos
Flutter Android ────────┘
        │
        └─> Firebase Auth anônimo + App Check + FCM
```

Endpoints principais:

- `weather`: geocoding, clima, previsões, AQI, mapas e imagens;
- `news`: notícias sanitizadas e cacheadas;
- `gemini`: assistente climática com limites, timeout, fallback e grounding;
- `mobile-installation`: registro/opt-out autenticado do dispositivo Android;
- `mobile-push-scheduled`: avaliação horária e deduplicada de alertas móveis.

O contrato atual está em [`docs/api-v1.md`](docs/api-v1.md). A implantação de
push está documentada em
[`docs/mobile-push-backend.md`](docs/mobile-push-backend.md).

## Desenvolvimento web e BFF

Pré-requisitos: Node.js 22 e npm 9 ou posterior.

```bash
npm ci
npm run check
npx netlify dev
```

`npm run check` executa typecheck, testes de contrato/segurança e build de
produção. Para a aplicação local conseguir chamar as Functions, prefira
`netlify dev` a executar somente o Vite.

### Variáveis server-side

Configure no Netlify, nunca em código ou em variáveis expostas pelo Vite:

```env
CLIMA_API=...
GEMINI_API=...
GNEWS_API=...
GNEWS_2=...                         # fallback opcional
UNSPLASH_ACCESS_KEY=...             # grafia preferida
METEOR_ALLOWED_ORIGINS=...          # opcional, separado por vírgulas
FIREBASE_SERVICE_ACCOUNT_JSON=...   # somente para o backend móvel
AWS_LAMBDA_JS_RUNTIME=nodejs22.x
```

`UNSPLASH_ACESS_KEY` continua aceito temporariamente para compatibilidade com o
nome legado, mas deve ser migrado para `UNSPLASH_ACCESS_KEY`.

Não são usados pela nova arquitetura: `FIREBASE_SERVER_KEY`, `FCM_VAPID_KEY`,
`VAPID_*`, `RESEND_API`, `EMAIL_FROM`, `NOTIFICATION_SECRET`, `SEARCH_API`,
`SEARCH_ID`, `WINDY_API`, `GROQ_API_KEY` e `OPENROUTER_API`. Depois de confirmar
que nenhum deploy externo depende delas, revogue e remova essas variáveis.

## Desenvolvimento Android

Na branch `android`:

```bash
cd mobile
flutter pub get
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build apk --debug
```

O app funciona sem Firebase quando compilado sem
`--dart-define=METEOR_FIREBASE_ENABLED=true`; apenas o push fica desabilitado.
As etapas humanas de Firebase, App Check, assinatura e GitHub Releases estão em
[`mobile/FIREBASE_SETUP.md`](https://github.com/elias001011/Meteor/blob/android/mobile/FIREBASE_SETUP.md)
e [`mobile/README.md`](https://github.com/elias001011/Meteor/blob/android/mobile/README.md).

## Branches e releases

- `main`: web, BFF e backend móvel;
- `android`: deriva de `main` e adiciona `mobile/` e o workflow de release.

Não existe mais uma branch de desenvolvimento permanente. CI roda nas duas
branches. Uma tag `android-vX.Y.Z`, criada a partir da branch `android` e com
versão idêntica ao `pubspec.yaml`, produz APK universal, APKs por ABI, AAB,
checksums SHA-256 e proveniência de build. A assinatura depende do environment
protegido `android-release` no GitHub.

## Segurança e privacidade

- segredos de provedores ficam apenas nas Netlify Functions;
- requisições recebem validação, limite de tamanho, timeout e respostas
  sanitizadas;
- links externos passam por validação antes de chegar à UI;
- o app Android usa Auth anônimo e App Check antes de registrar um token FCM;
- localização móvel é aproximada no servidor, não há histórico de trajetos e o
  opt-out remove imediatamente a instalação registrada;
- nunca são versionados keystore, senhas, service account ou
  `google-services.json` de produção.

Consulte [`SECURITY.md`](SECURITY.md) para comunicar uma vulnerabilidade. Antes
de distribuir o app Android ao público, ainda é obrigatório publicar uma política
de privacidade e preencher a declaração Data Safety conforme os serviços
realmente habilitados.

## Licença

Distribuído sob a licença MIT.
