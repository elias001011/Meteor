# Política de Segurança

## Versões Suportadas

Atualmente o projeto se encontra na versão **3.3.0**. Todas as novas atualizações substituem as versões anteriores e focam em manter a integridade dos dados e a segurança das chaves de API através de processamento serverless.

| Versão | Suportada | Notas |
| ------- | --------- | ----- |
| 3.3.0   | ✅        | Versão atual com diretrizes de segurança de IA reforçadas. |
| 3.2.x   | ❌        | Versão anterior (Recomendado atualizar). |
| 3.1.x   | ❌        | Versão anterior. |
| 2.5.x   | ❌        | Legado. |


## Reportando uma Vulnerabilidade

Se você encontrar uma vulnerabilidade neste projeto, por favor entre em contato pelo e-mail:

**elias.juriatti@outlook.com**

Nós analisaremos o problema e responderemos o mais rápido possível.  
**Por favor, não abra issues públicas para vulnerabilidades de segurança.**

### Medidas de Segurança Implementadas:
1. **Backend-for-Frontend (BFF):** Todas as requisições para APIs de terceiros (OpenWeather, Gemini, Google Search) são feitas através de Netlify Functions. Isso garante que as chaves de API nunca sejam expostas ao cliente final.
2. **Sanitização de Inputs:** Filtros aplicados em prompts de IA para prevenir injeções maliciosas.
3. **Ofuscação de Cache:** Dados sensíveis salvos no LocalStorage passam por um processo simples de codificação para evitar leitura direta por outros scripts de domínio.