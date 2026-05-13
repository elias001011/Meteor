
# Política de Segurança

## Versões Suportadas

Atualmente o projeto se encontra na versão **5.8.0**. Todas as novas atualizações substituem as versões anteriores.

| Versão | Suportada | Notas |
| ------- | --------- | ----- |
| 5.8.0   | ✅        | Versão atual (IA com Gemini 3.1 Flash-Lite, Google Search grounding nativo, backup local em arquivo, sem login). |
| 5.3.0   | ❌        | Histórico anterior. |
| 4.3.0   | ❌        | Obsoleto. |
| 4.2.0   | ❌        | Obsoleto. |
| 4.1.0   | ❌        | Obsoleto. |
| 4.0.0   | ❌        | Obsoleto. |


## Reportando uma Vulnerabilidade

Se você encontrar uma vulnerabilidade neste projeto, por favor entre em contato pelo e-mail:

**elias.juriatti@outlook.com**

Nós analisaremos o problema e responderemos o mais rápido possível.  
**Por favor, não abra issues públicas para vulnerabilidades de segurança.**

### Medidas de Segurança Implementadas:
1. **Backend-for-Frontend (BFF):** Todas as requisições para APIs de terceiros (OpenWeather, Gemini e Google Search grounding) são feitas através de Netlify Functions.
2. **Sanitização de Inputs:** Filtros aplicados em prompts de IA para prevenir injeções maliciosas.
3. **Backup Validado:** Importação de arquivo JSON com validação de formato, limites de tamanho e filtragem de campos permitidos.
4. **Cabeçalhos de Segurança:** O deploy inclui políticas de navegador mais restritivas para reduzir risco de XSS e clickjacking.
