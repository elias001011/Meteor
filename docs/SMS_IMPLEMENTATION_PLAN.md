# 📱 Plano de Implementação: SMS Alerts no Meteor

> **Status:** Planejamento Futuro  
> **Prioridade:** Média (Após estabilização do Push/Email)  
> **Estimativa:** 2-3 dias de desenvolvimento

---

## 🎯 Resumo

Plano técnico completo para adicionar envio de SMS como canal de alertas meteorológicos, complementando Push e Email.

### Por que SMS?
- **Alcance universal:** Qualquer celular, sem internet
- **98% de abertura** em 3 minutos
- **Alta confiabilidade** em emergências

---

## 🔧 Arquitetura

```
Meteor App → Netlify Function → Twilio API → SMS
```

---

## 📋 Etapas de Implementação

### Fase 1: Setup (Dia 1)
- [ ] Criar conta Twilio
- [ ] Adquirir número brasileiro
- [ ] Configurar variáveis de ambiente
- [ ] Instalar dependência: `npm install twilio`

### Fase 2: Backend (Dia 1-2)
**Função:** `netlify/functions/send-sms-alert.ts`
- Validação de número (formato E.164)
- Rate limiting (1/min, max 10/dia)
- Envio via Twilio
- Tratamento de erros

### Fase 3: Frontend (Dia 2)
- Seção "SMS" na aba Alertas
- Input de telefone com máscara: `(99) 99999-9999`
- Verificação OTP (6 dígitos)
- Seleção de severidade (crítico/warning/todos)

### Fase 4: LGPD (Dia 2-3)
- Consentimento explícito
- Registro de opt-in (data, IP, userAgent)
- Link de opt-out em toda mensagem
- Política de privacidade atualizada

---

## 💰 Custo Estimado

| Item | Valor |
|------|-------|
| Custo por SMS | ~R$ 0,50 |
| Estimativa mensal (100 usuários) | ~R$ 50 |

---

## ⚡ Provider Recomendado: Twilio

**Por quê:**
- API madura e documentada
- SDK Node.js oficial
- Suporte a serverless/Netlify
- SLA 99.95%

**Alternativa nacional:** Zenvia (suporte em português)

---

## 📝 Variáveis de Ambiente

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+5511xxxxxxxx
```

---

## 📱 Comparação de Canais

| Critério | SMS | Push | Email |
|----------|-----|------|-------|
| Custo | R$ 0,50 | Grátis | Grátis |
| Alcance | 100% | Requer app | Requer internet |
| Abertura | 98% | 90% | 20% |
| Funciona offline | ✅ | ✅ | ❌ |
| Emergências | ✅ Melhor | ⚠️ Bateria | ❌ |

---

## 🚀 Decisão Recomendada

**Estratégia Cascata:**
```
1. Push (grátis, instantâneo)
2. Se falhar → SMS (custo R$ 0,50)
3. Sempre → Email (registro)
```

---

**Nota:** SMS é recomendado apenas para alertas **críticos** devido ao custo. Push e Email já cobrem a maioria dos casos.
