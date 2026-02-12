# 🌩️ Meteor - Gerando o APK Android

Este guia explica como gerar um APK do Meteor usando **Trusted Web Activity (TWA)**, a tecnologia oficial do Google para converter PWAs em apps Android nativos.

---

## 📋 Índice

1. [O que é TWA?](#o-que-é-twa)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo a Passo](#passo-a-passo)
4. [Configurando Notificações Push Nativas](#configurando-notificações-push-nativas)
5. [Publicando na Play Store](#publicando-na-play-store)
6. [Solução de Problemas](#solução-de-problemas)

---

## O que é TWA?

**Trusted Web Activity** é uma tecnologia que encapsula seu PWA em um app Android nativo:

- ✅ **APK super leve** (~150KB vs ~20MB de apps híbridos)
- ✅ **Sempre atualizado** (carrega direto do seu servidor)
- ✅ **Notificações push nativas** via FCM
- ✅ **Splash screen nativa** com seu ícone
- ✅ **Shortcuts** na tela inicial
- ✅ **Sem código nativo** para manter

---

## Pré-requisitos

### 1. Java JDK 11+

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# macOS
brew install openjdk@11

# Verificar instalação
java -version
```

### 2. Android SDK

**Opção A - Android Studio (recomendado):**
1. Baixe em [developer.android.com/studio](https://developer.android.com/studio)
2. Instale e anote o caminho do SDK

**Opção B - Command Line Tools:**
```bash
# Criar diretório
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools

# Baixar
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-*.zip
mv cmdline-tools latest

# Configurar variáveis (adicione ao ~/.bashrc ou ~/.zshrc)
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Instalar plataformas
cd ~
source ~/.bashrc
sdkmanager "platforms;android-33" "build-tools;33.0.0"
```

### 3. Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli

# Verificar instalação
bubblewrap --version
```

---

## Passo a Passo

### 1. Inicializar o Projeto TWA

```bash
cd android

# Gerar keystore (certificado de assinatura)
./build-apk.sh init

# Ou manualmente:
keytool -genkey -v \
  -keystore android.keystore \
  -alias meteor \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass meteor123 \
  -keypass meteor123 \
  -dname "CN=Meteor, OU=Dev, O=Meteor, L=Sao Paulo, ST=SP, C=BR"
```

> ⚠️ **IMPORTANTE**: Guarde o arquivo `android.keystore` em local seguro! Você precisará dele para todas as atualizações do app.

### 2. Configurar o Manifest

Edite `twa-manifest.json` com seus dados:

```json
{
  "packageId": "app.meteor.weather",
  "host": "SEU_DOMINIO.com",
  "name": "Meteor",
  "enableNotifications": true
}
```

### 3. Build do APK

```bash
# Gerar APK (para instalação direta)
./build-apk.sh build

# Ou com Bubblewrap diretamente
bubblewrap init --manifest https://seu-dominio.com/manifest.json
bubblewrap build
```

O APK será gerado em `./app/app-release-signed.apk`

### 4. Instalar no Dispositivo

```bash
# Conectar dispositivo via USB (com USB debugging ativado)
adb devices

# Instalar APK
adb install ./app/app-release-signed.apk

# Ou: transferir o arquivo para o celular e instalar
```

---

## Configurando Notificações Push Nativas

### Diferença: Web Push vs FCM

| Recurso | Web Push | FCM (TWA) |
|---------|----------|-----------|
| Funciona em background | ⚠️ Limitado | ✅ Sim |
| Confiabilidade | ~90% | ~99% |
| Ícone customizado | ❌ Navegador | ✅ App |
| Som/Vibração | Limitado | ✅ Completo |
| Canais de notificação | ❌ | ✅ Sim |

### Setup do Firebase

1. **Criar projeto no Firebase:**
   - Acesse [console.firebase.google.com](https://console.firebase.google.com)
   - Crie um projeto "Meteor Weather"
   - Adicione um app Android

2. **Configurar o pacote:**
   - Nome do pacote: `app.meteor.weather` (ou o que você definiu)
   - Baixe o arquivo `google-services.json`

3. **Obter credenciais:**
   - Vá em Configurações do Projeto > Cloud Messaging
   - Copie a **Chave do servidor** (Server Key)
   - Guarde para usar nas variáveis de ambiente

### Configurar Variáveis de Ambiente

No Netlify, adicione:

```
FIREBASE_SERVER_KEY=sua_chave_aqui
NOTIFICATION_SECRET=um_segredo_para_proteger_o_endpoint
```

### Atualizar o Frontend

No seu `App.tsx` ou ponto de entrada:

```typescript
import { initFCM, isRunningInTWA } from '../android/firebase-config';

// Detectar se está no TWA e inicializar FCM
useEffect(() => {
  if (isRunningInTWA()) {
    initFCM();
  }
}, []);
```

### Enviar Notificação de Teste

```bash
curl -X POST https://seu-site.netlify.app/.netlify/functions/sendFCMNotification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SECRET" \
  -d '{
    "token": "fcm_token_do_dispositivo",
    "title": "Teste Meteor",
    "body": "Notificação funcionando!",
    "data": {
      "channel": "weather_alerts",
      "tag": "test"
    }
  }'
```

---

## Publicando na Play Store

### 1. Gerar Android App Bundle (AAB)

```bash
# O AAB é o formato exigido pela Play Store
./build-apk.sh aab

# Ou manualmente
cd app
bubblewrap build --format aab
```

O arquivo será: `./app/app-release-bundle.aab`

### 2. Criar Conta de Desenvolvedor

- Acesse [play.google.com/console](https://play.google.com/console)
- Pague a taxa única de $25
- Complete os dados da conta

### 3. Configurar App na Play Store

1. Criar novo app
2. Preencher:
   - Nome: Meteor
   - Descrição curta e completa
   - Screenshots (mínimo 2)
   - Ícone (512x512)
   - Feature graphic (1024x500)

3. **Configurar assinatura:**
   - Use o mesmo keystore gerado anteriormente
   - Ou deixe a Play Store gerenciar a assinatura (recomendado)

4. **Upload do AAB**

5. **Testes:**
   - Teste interno (você e sua equipe)
   - Teste fechado (beta testers)
   - Teste aberto

6. **Lançamento**

### 4. Configurar Digital Asset Links

Para que o TWA funcione corretamente, você precisa provar que possui o domínio:

Crie o arquivo `/.well-known/assetlinks.json` no seu site:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.meteor.weather",
    "sha256_cert_fingerprints": [
      "XX:XX:XX..."  // fingerprint do seu keystore
    ]
  }
}]
```

Para obter o fingerprint:

```bash
keytool -list -v \
  -keystore android.keystore \
  -alias meteor \
  -storepass meteor123
```

---

## Solução de Problemas

### "Command bubblewrap not found"

```bash
npm install -g @bubblewrap/cli
# ou
npx bubblewrap
```

### "Java not found"

```bash
# Verificar instalação
which java
java -version

# Configurar JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

### "Android SDK not found"

```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Recarregar
source ~/.bashrc
```

### App abre no navegador em vez de TWA

Verifique se:
1. O Digital Asset Links está correto (`/.well-known/assetlinks.json`)
2. O `package_name` corresponde ao do twa-manifest.json
3. O fingerprint SHA256 está correto
4. O arquivo assetlinks.json é acessível publicamente

### Notificações não funcionam

Verifique:
1. `enableNotifications: true` no twa-manifest.json
2. Permissão de notificação concedida no Android
3. FCM token está sendo salvo corretamente
4. Firebase Server Key está configurado no Netlify

---

## Comandos Úteis

```bash
# Limpar build
./build-apk.sh clean

# Verificar APK gerado
aapt dump badging app-release-signed.apk

# Instalar e debugar
adb install -r app-release-signed.apk
adb logcat | grep meteor

# Verificar assetlinks
 curl https://seu-site.com/.well-known/assetlinks.json
```

---

## Recursos Adicionais

- [Documentação TWA](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Asset Links Generator](https://developers.google.com/digital-asset-links/tools/generator)

---

## Resumo dos Arquivos

```
android/
├── README.md              # Este arquivo
├── build-apk.sh          # Script de build
├── twa-manifest.json     # Configuração do TWA
├── firebase-config.js    # Configuração FCM
└── android.keystore      # Certificado (gerado)
    └── ⚠️ BACKUP ESTE ARQUIVO!
```

---

**Dúvidas?** Consulte a documentação oficial do Bubblewrap ou abra uma issue no projeto.
