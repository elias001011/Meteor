# Meteor — Landing Page

Landing page oficial do Meteor. Esta branch é independente de `main` (aplicação
web e backend) e `android` (aplicativo Flutter), para permitir um deploy próprio
no Netlify sem misturar os produtos.

## Produtos

- **Android v1:** aplicativo Flutter oficial, distribuído pelo GitHub Releases.
- **Meteor Web Legacy:** versão anterior ainda acessível enquanto a nova
  experiência web está em desenvolvimento.
- **Backend:** Netlify Functions da branch `main`; as chaves das APIs nunca são
  incluídas no APK ou nesta landing page.

## Desenvolvimento

Requisitos: Node.js 22 e npm 10 ou superior.

```bash
cd app
npm ci
npm run check
npm run dev
```

## Deploy no Netlify

Crie um site separado apontando para o repositório `elias001011/Meteor` e use a
branch de produção `LP`. O `netlify.toml` já configura:

- base: `app`
- build: `npm run build`
- publish: `dist`

Esta landing page não requer variáveis de ambiente nem secrets.

## Links

- Android v1: https://github.com/elias001011/Meteor/releases/tag/android-v1.0.0
- Web Legacy: https://meteor-ai.netlify.app
- Código e issues: https://github.com/elias001011/Meteor
- Políticas: https://policies-meteor-ai.netlify.app/

As screenshots preservadas em `app/public/screenshots` documentam a interface
da versão web legada; elas não representam o aplicativo Flutter atual.
