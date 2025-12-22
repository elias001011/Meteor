# Meteor v3.3.0 ☄️

### Plataforma de Inteligência Climática e Resiliência Ambiental

![Status do Projeto](https://img.shields.io/badge/Status-Versão_Final-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_|_Vite_|_TypeScript-blue?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Netlify_Functions-green?style=for-the-badge)
![AI Power](https://img.shields.io/badge/Powered_by-Google_Gemini-purple?style=for-the-badge)
![Licença](https://img.shields.io/badge/License-Open_Source-brightgreen?style=for-the-badge)

O **Meteor** é uma Plataforma Digital Interativa de código aberto dedicada ao monitoramento climático avançado e à comunicação de risco. Concebido como a evolução tecnológica do projeto acadêmico **RS Alerta**, ele integra dados meteorológicos de precisão, mapas interativos e **Inteligência Artificial Generativa** para transformar dados brutos em informações acionáveis, fortalecendo a resiliência climática em qualquer localidade do mundo.

🔗 **Acesse a Demonstração:** [meteor-ai.netlify.app](https://meteor-ai.netlify.app)

---

## 🚀 Novidades da Versão 3.3.0 (Inteligência & Refinamento)

Esta versão foca em tornar o Meteor mais inteligente, seguro e visualmente coeso:

*   **🌦️ Weather Insights 2.0:** Novo algoritmo de detecção de destaques climáticos que roda 100% localmente. Ele identifica padrões como "chuva parando", "alerta de UV extremo" ou "queda brusca de temperatura" para oferecer recomendações proativas no topo da tela.
*   **🎨 UI Refinada:** A tela de Ajustes foi completamente redesenhada em um sistema de abas flutuantes que respeita dinamicamente a cor do tema e o nível de transparência selecionado.
*   **🤖 IA com Melhor Formatação:** Respostas do chat agora utilizam uma renderização Markdown aprimorada, com suporte melhorado para listas, negritos e blocos de informação.
*   **🛡️ Segurança de Dados:** Implementação de diretrizes de segurança explícitas na configuração da IA e validação rigorosa de prompts para garantir uma interação ética e útil.

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
| **Resumo** | Exibição de dados técnicos. | **Weather Insights:** Resumos textuais inteligentes e recomendações de vestimenta/atividades. |

---

## 2. Funcionalidades Principais

*   **🌦️ Monitoramento em Tempo Real:** Acesso a dados essenciais como temperatura, vento, umidade, índice UV e qualidade do ar.
*   **🤖 Assistente de IA Integrado:** Chat inteligente que utiliza o modelo Gemini 2.5 para fornecer informações contextuais, ler dados do seu clima local e realizar buscas na web se necessário.
*   **🗺️ Mapas Interativos:** Camadas dinâmicas de precipitação, nuvens, temperatura e vento com múltiplos temas (Dark/Light/Relief).
*   **📱 PWA (Progressive Web App):** Experiência de aplicativo nativo instalável, com suporte a modo tela cheia e offline.
*   **⚙️ Personalização Total:** Controle de temas, densidade do layout, efeitos de transparência (Glassmorphism) e animações de clima.

---

## 3. Tecnologia Utilizada

| Componente | Tecnologia |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Netlify Functions (Node.js) |
| **IA** | Google Gemini API (`gemini-2.5-flash-lite`) |
| **Dados** | OpenWeatherMap, Open-Meteo |
| **Mapas** | Leaflet, OpenStreetMap, CartoDB |
| **Armazenamento** | Netlify Blobs (Rate-limiting), LocalStorage (Config/Cache) |

---

## 4. Rodando Localmente

1. **Clone:** `git clone https://github.com/elias001011/Meteor.git`
2. **Instale:** `npm install`
3. **Configure:** Crie um `.env` com `CLIMA_API`, `GEMINI_API` e `UNSPLASH_ACESS_KEY`.
4. **Execute:** `netlify dev`

---

Desenvolvido com 💙 por **Elias Juriatti Rodrigues Nunes** e focado em Salvar Vidas.