# Meteor ☄️

![Version](https://img.shields.io/badge/version-5.8.0-purple.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8.svg)
![Netlify](https://img.shields.io/badge/Netlify-Functions-00c7b7.svg)

**Meteor** é uma aplicação web progressiva de inteligência climática. O app combina previsão do tempo, mapas meteorológicos, notícias e uma assistente de IA contextual para entregar uma experiência visual, rápida e local-first.

A arquitetura principal segue o padrão **BFF (Backend-for-Frontend)** com Netlify Functions. O navegador nunca chama diretamente as APIs sensíveis: ele chama endpoints internos em `/.netlify/functions/*`, e as Functions acessam OpenWeather, GNews, Unsplash e Gemini usando variáveis de ambiente no servidor.

> Projeto desenvolvido por **Elias Nunes**.

---

## Visão geral

Meteor foi criado para ser um painel climático moderno, com foco em:

- consulta de clima atual e previsão;
- mapas com camadas meteorológicas;
- alertas e detalhes avançados;
- notícias relacionadas;
- assistente de IA especializada em clima;
- funcionamento local-first, sem login obrigatório.

O app mais recente pode ser acessado em: **https://meteor-ai.netlify.app**

---

## Funcionalidades

### Clima e previsão

- Clima atual com temperatura, sensação térmica, umidade, vento, pressão, UV e condição geral.
- Previsão horária e diária.
- Alertas meteorológicos quando disponíveis.
- Qualidade do ar e dados complementares.
- Fallback entre provedores quando a API principal falha ou atinge limites.

### Mapas

- Mapa interativo com Leaflet.
- Mapa base claro/escuro usando OpenStreetMap/CARTO.
- Camadas climáticas via OpenWeather Maps:
  - temperatura;
  - vento;
  - nuvens;
  - precipitação;
  - pressão;
  - relevo, quando a chave/plano da OpenWeather permite.
- As camadas são carregadas como tiles PNG por `z/x/y`, proxied por Netlify Function.

### Meteor AI

- Assistente baseada no Google Gemini.
- Recebe contexto do app, como clima atual, localização exibida e horário local.
- Usa Google Search grounding nativo quando a pergunta depende de informação recente ou verificável.
- Renderização controlada em React, sem HTML bruto da IA.

### Notícias

- Integração com GNews via Function server-side.
- Fallback entre chaves quando configurado.
- Sanitização de URLs externas antes de devolver links/imagens ao frontend.

### PWA e experiência visual

- Tema dinâmico baseado no clima.
- Modo Zen.
- Cache básico de shell/assets via Service Worker.
- O Service Worker não intercepta Netlify Functions, para evitar quebrar tiles do mapa e chamadas de API.

---

## Stack

- **Frontend:** React 19, TypeScript, Vite 7.
- **Estilo:** Tailwind CSS.
- **Mapas:** Leaflet, OpenStreetMap, CARTO, OpenWeather Maps.
- **Backend serverless:** Netlify Functions.
- **IA:** `@google/genai`.
- **Storage local:** LocalStorage.
- **Rate limit server-side:** Netlify Blobs.

---

## Arquitetura

```txt
Frontend React
  ↓
services/*
  ↓
/.netlify/functions/*
  ↓
APIs externas com chaves protegidas no servidor
```

Principais Functions:

```txt
netlify/functions/weather.ts
  Proxy climático, geocoding, previsão, tiles de mapa e fallback de fontes.

netlify/functions/gemini.ts
  Orquestra a IA climática com contexto do app e grounding do Gemini.

netlify/functions/news.ts
  Busca notícias na GNews, sanitiza retorno e aplica fallback de chave.

netlify/functions/security.ts
  Helpers compartilhados de rate limit, sanitização de URL e texto seguro.
```

---

## Segurança e privacidade

### O que já está protegido

- Chaves de API ficam em variáveis de ambiente no Netlify, não no bundle do navegador.
- Functions validam método HTTP, parâmetros e tamanho de entrada em pontos críticos.
- IA e notícias possuem rate limit por IP usando Netlify Blobs.
- Links e imagens externas das notícias passam por sanitização de URL.
- CSP configurada no `netlify.toml` para reduzir superfície de XSS.
- Service Worker não intercepta `/.netlify/functions/`, evitando respostas erradas para tiles/API.

### Dados locais

Meteor não usa login nem sincronização em nuvem. Dados como preferências, cache e histórico podem ser armazenados no navegador via LocalStorage. Isso melhora a experiência, mas significa que os dados ficam no dispositivo do usuário.

### Limitações conhecidas

- O app não possui autenticação de usuário; endpoints públicos dependem de rate limit e validação.
- Tiles de mapa podem consumir cota da OpenWeather se o app for muito acessado.
- A camada de relevo depende do acesso/plano disponível na chave OpenWeather.

---

## Variáveis de ambiente

Crie um `.env` local ou configure as variáveis no painel da Netlify:

```env
# Google Gemini
GEMINI_API=sua_chave_gemini

# OpenWeatherMap
CLIMA_API=sua_chave_openweather

# GNews
GNEWS_API=sua_chave_gnews
GNEWS_2=sua_chave_gnews_fallback_opcional

# Unsplash, opcional
UNSPLASH_ACESS_KEY=sua_chave_unsplash
```

> Observação: a IA não precisa de uma chave separada para busca. O projeto usa o grounding nativo do Gemini quando disponível.

---

## Rodando localmente

### Pré-requisitos

- Node.js 22+ recomendado.
- npm.
- Netlify CLI.

```bash
npm install -g netlify-cli
```

### Instalação

```bash
git clone https://github.com/elias001011/Meteor.git
cd Meteor
npm install
```

### Desenvolvimento

Use o Netlify CLI para que as Functions funcionem localmente:

```bash
netlify dev
```

O app normalmente ficará disponível em:

```txt
http://localhost:8888
```

### Build

```bash
npm run build
```

---

## Estrutura do projeto

```txt
components/
  ai/           Interface e renderização da IA
  map/          Mapa Leaflet e camadas climáticas
  weather/      Componentes de clima e previsão
  news/         Interface de notícias

services/
  weatherService.ts
  geminiService.ts
  newsService.ts
  settingsService.ts
  chatHistoryService.ts

netlify/functions/
  weather.ts
  gemini.ts
  news.ts
  security.ts

public/
  sw.js
```

---

## Branches

- `main`: versão estável/produção.
- `dev`: branch de desenvolvimento.
- `brackup-dev-6.0`: backup histórico da antiga `dev` antes da sincronização com `main`.
- `android`: mantida intacta para fluxo mobile.

---

## Licença

Distribuído sob licença MIT.
