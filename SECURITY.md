
# Política de Segurança

## Versões Suportadas

Atualmente o projeto se encontra na versão **3.6.0**. Todas as novas atualizações substituem as versões anteriores.

| Versão | Suportada | Notas |
| ------- | --------- | ----- |
| 4.0   | ✅        | Versão estável com novas informações climáticas. |
| 3.6.x   | ❌        | Obsoleto. |
| 3.5.x   | ❌        | Obsoleto. |


## Reportando uma Vulnerabilidade

Se você encontrar uma vulnerabilidade neste projeto, por favor entre em contato pelo e-mail:

**elias.juriatti@outlook.com**

Nós analisaremos o problema e responderemos o mais rápido possível.  
**Por favor, não abra issues públicas para vulnerabilidades de segurança.**

### Medidas de Segurança Implementadas:
1. **Backend-for-Frontend (BFF):** Todas as requisições para APIs de terceiros (OpenWeather, Gemini, Google Search) são feitas através de Netlify Functions.
2. **Sanitização de Inputs:** Filtros aplicados em prompts de IA para prevenir injeções maliciosas.
3. **Ofuscação de Cache:** Dados sensíveis salvos no LocalStorage passam por um processo simples de codificação.
