# Meteor v2.5 ☄️

### Plataforma de Inteligência Climática e Resiliência Ambiental

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_|_Vite_|_TypeScript-blue?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Netlify_Functions-green?style=for-the-badge)
![AI Power](https://img.shields.io/badge/Powered_by-Google_Gemini-purple?style=for-the-badge)
![Licença](https://img.shields.io/badge/License-Open_Source-brightgreen?style=for-the-badge)

O **Meteor** é uma Plataforma Digital Interativa de código aberto dedicada ao monitoramento climático avançado e à comunicação de risco. Concebido como a evolução tecnológica do projeto acadêmico **RS Alerta**, ele integra dados meteorológicos de precisão, mapas interativos e **Inteligência Artificial Generativa** para transformar dados brutos em informações acionáveis, fortalecendo a resiliência climática em qualquer localidade do mundo.

🔗 **Acesse a Demonstração:** [meteor-ai.netlify.app](https://meteor-ai.netlify.app)

---

## 1. O Legado do RS Alerta

O Meteor é o sucessor técnico e espiritual do **RS Alerta**, um projeto de pesquisa desenvolvido na Escola Estadual de Ensino Médio Dr. Aldo Conte (Sarandi/RS). O projeto original identificou uma falha crítica na comunicação de risco durante eventos climáticos extremos: a informação técnica não chegava de forma clara e acessível à população.

**O Meteor resolve este desafio transformando dados brutos em um diálogo personalizado e proativo.**

### Diferenciais em Relação ao Projeto Original:

| Característica | RS Alerta (Original) | Meteor (Evolução) |
| :--- | :--- | :--- |
| **Comunicação** | Exibição estática de alertas. | **IA Generativa (Gemini 2.5):** Interpreta dados, responde perguntas em linguagem natural e oferece conselhos personalizados de segurança. |
| **Escopo** | Focado em dados regionais. | **Arquitetura Global:** Funciona para qualquer cidade do mundo. |
| **Resiliência** | Dependência de uma única API. | **Múltiplos Fallbacks:** Troca automática entre APIs (OpenWeather OneCall, OpenWeather Free, Open-Meteo) para garantir a continuidade do serviço. |
| **Segurança** | Chaves de API no frontend (risco). | **Backend-for-Frontend (Netlify Functions):** Todas as chaves de API são protegidas no servidor. |

---

## 2. Funcionalidades Principais

O Meteor oferece um conjunto robusto de ferramentas para monitoramento e interação:

*   **🌦️ Monitoramento em Tempo Real:** Acesso a dados essenciais como temperatura, vento, umidade, índice UV, visibilidade e qualidade do ar.
*   **🤖 Assistente de IA Integrado:** Um chat inteligente que utiliza o modelo Gemini 2.5 para fornecer informações contextuais. A IA sabe a previsão do tempo para a sua localização e pode responder a perguntas complexas como: *"Qual a melhor hora para irrigar minhas plantas amanhã?"* ou *"Resuma a previsão para a semana em termos leigos."*
*   **🗺️ Mapas Interativos:** Camadas dinâmicas de precipitação, nuvens, temperatura e vento, construídas sobre o Leaflet e OpenStreetMap.
*   **📱 PWA (Progressive Web App):** Instalação rápida em dispositivos móveis e desktop, oferecendo uma experiência de aplicativo nativo com funcionamento em tela cheia.
*   **⚙️ Personalização Avançada:** Permite ao usuário escolher a fonte de dados preferida, definir instruções personalizadas para moldar a personalidade da IA e gerenciar o cache de dados.
*   **🛡️ Segurança e Privacidade:** Nenhuma chave de API é exposta no navegador. Toda a orquestração de dados e chamadas de IA é feita através de Funções Serverless (Netlify Functions).

---

## 3. Tecnologia Utilizada

O projeto é construído com uma arquitetura moderna e escalável:

| Componente | Tecnologia | Uso |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite | Interface de usuário rápida e tipada. |
| **Estilização** | Tailwind CSS | Desenvolvimento ágil e responsivo. |
| **Backend (Serverless)** | Netlify Functions (Node.js) | Orquestração de APIs, proteção de chaves e lógica de *rate-limiting*. |
| **Inteligência Artificial** | Google Gemini API (`gemini-2.5-flash-lite`) | Geração de respostas contextuais e análise de dados. |
| **Dados Meteorológicos** | OpenWeatherMap (OneCall 3.0 + Free Tier), Open-Meteo | Fontes primárias e de *fallback* para dados climáticos. |
| **Mapas** | Leaflet, OpenStreetMap | Renderização de mapas e camadas interativas. |
| **Armazenamento** | Netlify Blobs, LocalStorage | Controle de taxa de uso de API e armazenamento de preferências do usuário. |

---

## 4. Rodando Localmente (Desenvolvimento)

Siga estes passos para configurar e rodar o Meteor no seu ambiente de desenvolvimento:

### 4.1. Pré-requisitos

*   Node.js (versão 18 ou superior)
*   Gerenciador de pacotes (npm ou yarn)
*   Netlify CLI (necessário para rodar as funções serverless localmente)
    ```bash
    npm install netlify-cli -g
    ```

### 4.2. Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/elias001011/Meteor.git
cd Meteor
npm install
```

### 4.3. Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto e **adicione-o ao seu `.gitignore`** (o `.gitignore` já está configurado para ignorá-lo). Você precisará das seguintes chaves de API:

```env
# Obrigatório: Chave da API do OpenWeatherMap (para dados climáticos)
CLIMA_API=sua_chave_openweather

# Obrigatório: Chave da API do Google Gemini (para o assistente de IA)
GEMINI_API=sua_chave_gemini

# Opcional: Chave da API do Unsplash (para imagens de fundo das cidades)
UNSPLASH_ACESS_KEY=sua_chave_unsplash

# Opcional: Chave e ID para busca na web via IA (Google Custom Search)
SEARCH_API=sua_chave_google_search
SEARCH_ID=seu_search_engine_id
```

### 4.4. Executando o Projeto

Para que o Frontend e as Funções Serverless (Backend) rodem juntos, utilize o Netlify CLI:

```bash
netlify dev
```

O projeto estará disponível em `http://localhost:8888`.

> **Nota:** Se você usar apenas `npm run dev`, a interface carregará, mas as chamadas de API falharão, pois dependem das Netlify Functions para proteger e orquestrar as chaves.

---

## 5. Créditos do Projeto Acadêmico (Base Teórica)

O projeto Meteor é baseado no trabalho de pesquisa e desenvolvimento do **RS Alerta**, realizado por:

**Alunos:**
*   Elias Juriatti Rodrigues Nunes
*   Guilherme Zatti
*   Richard Albuquerque Couto
*   Laísa Linke da Silva

**Orientação:**
*   Prof. Franciele Pedrolo
*   Prof. Fabiana Oliveira

**Instituição:**
*   Escola Estadual de Ensino Médio Dr. Aldo Conte (Sarandi/RS)

Desenvolvido com 💙 e foco em Salvar Vidas.