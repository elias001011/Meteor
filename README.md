
# Meteor ☄️
### Inteligência Climática & Alertas Ambientais

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/React-Vite_|_Netlify_Functions-blue?style=for-the-badge)
![AI Power](https://img.shields.io/badge/Powered_by-Google_Gemini-purple?style=for-the-badge)

O **Meteor** é uma Plataforma Digital Interativa para monitoramento climático avançado, concebida como a evolução tecnológica do projeto acadêmico **RS Alerta**. Ele combina dados meteorológicos de precisão, mapas interativos e Inteligência Artificial Generativa para fortalecer a comunicação de risco e a resiliência climática.

🔗 **Acesse agora:** [meteor-ai.netlify.app](https://meteor-ai.netlify.app)

---

## 📜 Histórico: O Legado do RS Alerta

O Meteor é o sucessor espiritual e técnico do **RS Alerta**, um projeto de pesquisa desenvolvido na **Escola Estadual de Ensino Médio Dr. Aldo Conte** (Sarandi/RS).

O RS Alerta nasceu em resposta à catástrofe climática de abril/maio de 2024 no Rio Grande do Sul. O estudo identificou que, além da infraestrutura, houve uma falha crítica na **comunicação de risco**: a informação técnica não chegava de forma clara e acionável à população.

**O Meteor resolve isso transformando dados brutos em diálogo.**

### Diferenciais em relação ao projeto original:
*   **IA Generativa (Google Gemini):** Em vez de apenas exibir alertas, a IA interpreta os dados, responde perguntas em linguagem natural e dá conselhos personalizados de segurança.
*   **Arquitetura Global:** Embora focado na resiliência local, o sistema funciona para qualquer cidade do mundo.
*   **Resiliência de Dados:** Implementação de múltiplos "Fallbacks". Se a API principal (OpenWeather OneCall) falhar ou atingir o limite, o sistema muda automaticamente para APIs gratuitas (OpenWeather Free) ou Open Source (Open-Meteo), garantindo que o serviço nunca saia do ar.

---

## ✨ Funcionalidades

*   **🌦️ Monitoramento em Tempo Real:** Temperatura, vento, umidade, UV, visibilidade e qualidade do ar.
*   **🤖 Assistente de IA (Gemini 2.5):** Um chat integrado que sabe onde você está e como está o tempo. Pergunte *"Vai chover na hora do meu jogo?"* ou *"O que fazer em caso de enchente?"*.
*   **🗺️ Mapas Interativos:** Camadas visuais de precipitação, nuvens, temperatura e vento sobrepostas ao mapa.
*   **📱 PWA (Progressive Web App):** Instale no celular como um aplicativo nativo, com suporte a funcionamento em tela cheia e ícones adaptativos.
*   **⚙️ Personalização Total:**
    *   Escolha sua fonte de dados preferida (OpenWeather ou Open-Meteo).
    *   Modo Tela Cheia e controle de exibição de relógio.
    *   Instruções personalizadas para moldar a personalidade da IA.
*   **🛡️ Privacidade e Segurança:** Nenhuma chave de API é exposta no navegador. Toda a comunicação é feita através de um Backend-for-Frontend (Netlify Functions).

---

## 🛠️ Tecnologias

*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
*   **Backend (Serverless):** Netlify Functions (Node.js) para orquestração de APIs e proteção de chaves.
*   **Inteligência Artificial:** Google Gemini API (Modelo `gemini-2.5-flash-lite`).
*   **Dados Meteorológicos:** OpenWeatherMap (OneCall 3.0 + Free Tier) e Open-Meteo.
*   **Mapas:** Leaflet + OpenStreetMap.
*   **Armazenamento:** Netlify Blobs (para controle de taxa/rate-limiting) e LocalStorage (para preferências do usuário).

---

## 🚀 Rodando Localmente

Siga estes passos para rodar o Meteor no seu computador:

### 1. Pré-requisitos
*   Node.js (versão 18 ou superior)
*   Gerenciador de pacotes (NPM ou Yarn)
*   Netlify CLI (Recomendado para rodar as funções serverless localmente)
    ```bash
    npm install netlify-cli -g
    ```

### 2. Instalação
Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/meteor.git
cd meteor
npm install
```

### 3. Configuração de Ambiente (.env)
Crie um arquivo `.env` na raiz do projeto. Você precisará das seguintes chaves (obtenha-as nos respectivos portais de desenvolvedor):

```env
# Obrigatório: API do OpenWeatherMap
CLIMA_API=sua_chave_openweather

# Obrigatório: API do Google Gemini (AI Studio)
GEMINI_API=sua_chave_gemini

# Opcional: Para imagens de fundo das cidades
UNSPLASH_ACESS_KEY=sua_chave_unsplash

# Opcional: Para busca na web via IA (Google Custom Search)
SEARCH_API=sua_chave_google_search
SEARCH_ID=seu_search_engine_id
```

### 4. Executando o Projeto
Para que o Frontend e as Funções Backend rodem juntos, use o Netlify CLI:

```bash
netlify dev
```
O projeto estará disponível em `http://localhost:8888`.

> **Nota:** Se usar apenas `npm run dev`, a interface carregará, mas as chamadas de API falharão pois dependem das Netlify Functions.

---

## 📖 Como Usar (Interface Web)

1.  **Início:** Ao abrir, o app pode usar sua localização ou pedir para selecionar uma cidade.
2.  **Fonte de Dados:** Toque no ícone de "Banco de Dados" no rodapé da previsão para alternar entre provedores (ex: mudar para Open-Meteo se quiser economizar dados da chave principal).
3.  **IA:** Clique na aba "IA" ou no ícone flutuante (mobile). A IA já sabe o clima da cidade que você está vendo. Tente pedir: *"Resuma a previsão para a semana"* ou *"Crie um alerta para meus vizinhos sobre a chuva"*.
4.  **Ajustes:** Vá em "Mais" > "Ajustes" para definir seu nome, instruções para a IA e gerenciar o cache.

---

## 👥 Créditos do Projeto Acadêmico (Base Teórica)

**Alunos:**
*   Elias Juriatti Rodrigues Nunes
*   Guilherme Zatti
*   Richard Albuquerque Couto
*   Laísa Linke da Silva
*   Fernanda Damasceno Maragno

**Orientação:**
*   Prof. Franciele Pedrolo
*   Prof. Fabiana Oliveira

**Instituição:**
*   Escola Estadual de Ensino Médio Dr. Aldo Conte (Sarandi/RS)

---

Desenvolvido com 💙 e foco em Salvar Vidas.
