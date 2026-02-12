# 📚 Documentação Firebase Cloud Messaging (FCM) - Meteor

> **⚠️ IMPORTANTE**: O sistema FCM foi removido temporariamente na versão 5.3.0 devido a problemas com notificações push. Esta documentação é para referência futura quando o sistema for reimplementado.

---

## 🔥 Visão Geral

O FCM (Firebase Cloud Messaging) foi implementado na branch android para fornecer notificações push mais confiáveis no APK Android do Meteor. Enquanto o Web Push padrão funciona bem em navegadores, o FCM oferece:

- **Maior confiabilidade** (~99% vs ~85% do Web Push)
- **Funcionamento em background** completo
- **Ícone nativo personalizado**
- **Controle total** de som/vibração
- **Analytics detalhado**

---

## 📁 Arquivos do Sistema FCM (Removidos na v5.3.0)

### Frontend
- `android/firebase-config.js` - Configuração e inicialização do Firebase

### Backend (Netlify Functions)
- `netlify/functions/saveFCMToken.ts` - Salva tokens FCM no banco
- `netlify/functions/sendFCMNotification.ts` - Envia notificações via FCM

### Documentação
- `android/FCM_SETUP.md` - Guia completo de configuração
- `android/FIREBASE_SERVER_KEY.md` - Instruções para a Server Key
- `android/NOTIFICATIONS_IMPROVEMENTS.md` - Melhorias planejadas

---

## 🔐 Configuração das Variáveis de Ambiente (Netlify)

Para reativar o FCM no futuro, configure estas variáveis no Netlify:

```
FIREBASE_SERVER_KEY=AAAA... (sua chave do Firebase)
NOTIFICATION_SECRET=qualquer_senha_segura_aqui
```

**Onde obter a FIREBASE_SERVER_KEY:**
1. Acesse: https://console.firebase.google.com
2. Selecione o projeto "Meteor Weather"
3. ⚙️ Configurações do projeto → Cloud Messaging
4. Copie a "Chave do servidor" (Server Key)
   - Começa com `AAAA...`

---

## 📱 Configuração do Firebase

### Projeto Existente
- **Project ID**: `meteor-weather-13033`
- **Project Number**: `919442203209`
- **Package**: `app.meteor.weather`
- **App ID**: `1:919442203209:android:e1a3dc2b50639982701598`

### API Key
A API Key do Firebase está disponível no dashboard do Firebase Console. **Nunca commite esta chave!**

---

## 🚀 Reimplementação Futura

Para reimplementar o FCM em uma versão futura:

1. **Restaurar arquivos** da branch `5.7-android-backup`:
   ```bash
   git checkout 5.7-android-backup -- android/firebase-config.js
   git checkout 5.7-android-backup -- netlify/functions/saveFCMToken.ts
   git checkout 5.7-android-backup -- netlify/functions/sendFCMNotification.ts
   git checkout 5.7-android-backup -- android/FCM_SETUP.md
   ```

2. **Configurar variáveis** no Netlify (conforme seção acima)

3. **Adicionar dependências** no package.json:
   ```json
   "dependencies": {
     "web-push": "^3.6.7"
   }
   ```

4. **Testar** o envio de notificações

---

## 📝 Notas de Segurança

- ✅ Use sempre variáveis de ambiente para chaves
- ✅ Proteja endpoints com `NOTIFICATION_SECRET`
- ✅ Valide tokens antes de salvar
- ❌ Nunca commite `google-services.json`
- ❌ Nunca exponha `FIREBASE_SERVER_KEY` no código

---

## 📚 Recursos

- [Documentação Oficial FCM](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Console](https://console.firebase.google.com)
- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity)

---

**Backup da implementação FCM disponível em**: `5.7-android-backup`
