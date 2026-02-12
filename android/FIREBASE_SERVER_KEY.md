# 🔑 Onde encontrar a Server Key do FCM

## ❌ NÃO é Database Secrets

Se você viu a mensagem:  
> "O uso dos secrets do Database foi descontinuado..."

**Você está na aba errada!** 

## ✅ Caminho Correto

### Método 1: Cloud Messaging API (Legada) - MAIS FÁCIL

1. Acesse: https://console.firebase.google.com/project/meteor-weather-13033/settings/cloudmessaging
2. Ou vá em: **⚙️ Configurações do projeto** → **Cloud Messaging**
3. Role até **"Firebase Cloud Messaging API (V1)"**
4. Clique no menu de 3 pontos ⋮ → **"Gerenciar credenciais da API"**
5. Ou procure por **"Chave do servidor"** / **"Server key"**

**A chave começa com:** `AAAA...` (é longa, ~150 caracteres)

### Método 2: API Keys (Alternativo)

1. Vá em: **⚙️ Configurações do projeto** → **Geral**
2. Aba: **Suas apps** → Seção **Web App**
3. Clique em **"Configuração do SDK"**
4. Lá mostra várias chaves, mas para FCM você precisa especificamente da:
   - **Server Key** (não a API Key, não a App ID!)

### Método 3: Service Accounts (Para Admin SDK)

Se não achar a Server Key legada, use o novo método:

1. **⚙️ Configurações do projeto** → **Contas de serviço**
2. Clique em **"Gerar nova chave privada"**
3. Baixe o arquivo JSON
4. Esse arquivo contém a chave para o Admin SDK (mais seguro)

---

## 🔧 Configurar no Netlify

### Variáveis de Ambiente necessárias:

```
# Opção 1: Server Key (Legada - mais fácil)
FIREBASE_SERVER_KEY=AAAAaBcDeFgHiJkLmN...

# Opção 2: Credenciais do Service Account (Nova - mais segura)
FIREBASE_PROJECT_ID=meteor-weather-13033
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@meteor-weather-13033.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n
# Segurança (para proteger os endpoints)
NOTIFICATION_SECRET=sua_senha_segura_aqui_aleatoria
```

---

## 📋 Resumo do seu Firebase

**Project:** meteor-weather-13033  
**Package:** app.meteor.weather  
**App ID:** 1:919442203209:android:e1a3dc2b50639982701598  

**O que falta:**
- [ ] Pegar Server Key do Cloud Messaging
- [ ] Adicionar ao Netlify
- [ ] Testar envio de notificação

---

## 🧪 Testar FCM (quando tiver a Server Key)

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Content-Type: application/json" \
  -H "Authorization: key=SUA_SERVER_KEY_AQUI" \
  -d '{
    "to": "TOKEN_DO_DISPOSITIVO",
    "notification": {
      "title": "Teste Meteor",
      "body": "Funcionou!"
    }
  }'
```

---

**Ainda não achou?** Me mostre uma screenshot do que você vê em Cloud Messaging que te ajudo! 📸
