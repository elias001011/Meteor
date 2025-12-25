
# Meteor  ☄️

![Version](https://img.shields.io/badge/version-4.2.0-purple.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8.svg)

**Meteor** é uma aplicação web progressiva (PWA) de inteligência climática. Combina dados meteorológicos precisos de múltiplas fontes com uma assistente de IA generativa contextual (powered by Gemini) para fornecer previsões, alertas e insights personalizados em tempo real.

O projeto utiliza uma arquitetura **BFF (Backend-for-Frontend)** via Netlify Functions para garantir segurança das chaves de API e performance.

---

## ✨ Funcionalidades Principais (v4.2.0)

*   **🔍 Previsão Avançada & Detalhada:**
    *   **Novo Pop-up Completo:** Visualize rajadas de vento, ponto de orvalho, pressão e fases da lua tanto na previsão horária quanto diária.
    *   **Min/Max Diária:** Visualização clara das temperaturas mínima e máxima no detalhe do dia.
    *   **Layout Responsivo Aprimorado:** Grades de informação ajustáveis automaticamente para layouts Desktop (25/75, 50/50) e Mobile.

*   **🌦️ Clima em Tempo Real:**
    *   Suporte a múltiplas fontes de dados: **OpenWeather (OneCall 3.0 & Free)** e **Open-Meteo**.
    *   Fallback automático inteligente em caso de falha de API ou limites excedidos.
    *   Alertas meteorológicos com design "Red Alert" de alta visibilidade.
    *   Qualidade do Ar (AQI) e componentes poluentes.

*   **🤖 Meteor AI (Assistente Inteligente):**
    *   Baseada no **Google Gemini 2.5 Flash Lite**.
    *   Contexto completo: A IA "vê" o clima da sua tela, hora local e histórico de conversa.
    *   **Ferramentas (Stealth Tools):** A IA pode decidir autonomamente buscar dados na Web (Google Search) ou consultar o clima de outras cidades globais.
    *   **Segurança Reforçada:** Diretrizes estritas contra injeção de prompt.

*   **🎨 Experiência Visual Imersiva:**
    *   **Motor de Temas Dinâmico:** A cor do app muda conforme o clima (Sol, Chuva, Nublado, Noite).
    *   **Animação de Chuva 2.0:** Calibrada para realismo e performance (ajustes de opacidade e quantidade de partículas).
    *   **Sistema de Transparência:** Modos Sólido, Sutil, Equilibrado e Vidro padronizados.
    *   **Zen Mode**: Experimente deixar o Meteor como seu protetor de tela com o novo Zen Mode, visualize e sinta a experiência na sua tela.

---

## 🛠️ Stack Tecnológica

*   **Frontend:** React 19, TypeScript, Vite 7.
*   **Estilização:** Tailwind CSS.
*   **Mapas:** Leaflet + OpenStreetMap + Camadas OpenWeather.
*   **Backend (Serverless):** Netlify Functions (Node.js).
*   **IA:** Google GenAI SDK (`@google/genai`).
*   **Gerenciamento de Estado:** React Context API + LocalStorage.

---

## 🚀 Como Rodar Localmente

Para rodar o projeto com todas as funcionalidades (IA e Clima), é necessário usar o **Netlify CLI**, pois as chaves de API são protegidas no lado do servidor e não funcionam apenas com o Vite.

### 1. Pré-requisitos
*   Node.js (v18+)
*   NPM ou Yarn
*   Git
*   Netlify CLI global (`npm install -g netlify-cli`)

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/meteor.git
cd meteor

# Instale as dependências
npm install
```

### 3. Configuração (.env)

Crie um arquivo `.env` na raiz do projeto com as chaves de API necessárias:

```env
# Google Gemini API (https://aistudio.google.com/)
GEMINI_API="sua_chave_aqui"

# OpenWeatherMap API (https://openweathermap.org/)
CLIMA_API="sua_chave_aqui"

# Google Custom Search API (Para capacidade de busca da IA)
SEARCH_API="sua_chave_google_search"
SEARCH_ID="seu_search_engine_id"

# Unsplash API (Opcional - Para imagens de fundo das cidades)
UNSPLASH_ACESS_KEY="sua_chave_unsplash"
```

### 4. Execução

Use o Netlify CLI para iniciar o servidor de desenvolvimento. Isso permitirá que o frontend (Vite) se comunique com as funções serverless localmente.

```bash
netlify dev
```
O app estará disponível em `http://localhost:8888`.

---

## 📂 Estrutura do Projeto

*   `/src` (Raiz): Código fonte do Frontend.
    *   `/components`: UI modular (Weather, AI, Map, Settings).
    *   `/services`: Camada de serviço para comunicação com o BFF.
    *   `/context`: Gestão de estado global (ThemeContext).
*   `/netlify/functions`: **Backend Serverless**.
    *   `weather.ts`: Proxy e lógica de cache/fallback para APIs de clima.
    *   `gemini.ts`: Orquestrador da IA, injeção de prompt de sistema e ferramentas.
    *   `search.ts`: Proxy para Google Custom Search.

---

## 🔒 Privacidade e Dados

*   **Local-First:** Histórico de chat e configurações são salvos apenas no LocalStorage do navegador.
*   **Cache:** Dados meteorológicos são cacheados localmente para reduzir chamadas de API.
*   **Segurança:** Nenhuma chave de API é exposta no código do cliente.

---

## 📄 Licença

Distribuído sob a licença MIT.
Desenvolvido por @elias_jrnunes
**ATENÇÃO:** As notas de versão desse software são apenas para referência, o software mais recente sempre estará disponível para acesso em "meteor-ai.netlify.app". Recomenda-se sempre ter a versão mais recente rodando localmente.
