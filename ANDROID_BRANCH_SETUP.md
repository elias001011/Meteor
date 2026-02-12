# 📱 Configuração da Branch Android

Este documento explica como funciona a branch `android` e como ela se mantém sincronizada automaticamente.

---

## 🏗️ Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   main      │────→│    dev      │────→│    android      │
│  (produção) │     │ (desenvolv) │     │   (APK build)   │
└─────────────┘     └─────────────┘     └─────────────────┘
                            │                    │
                            │    GitHub Actions  │
                            └────────────────────┘
                                   (auto-sync)
```

---

## 🔄 Fluxo de Sincronização

### Automático (GitHub Actions)

Toda vez que houver push na branch `dev`:

1. **GitHub Actions** detecta o push
2. Atualiza a branch `android` com as mudanças de `dev`
3. Faz push da branch `android` atualizada

**Arquivo:** `.github/workflows/sync-android-branch.yml`

### Manual (se necessário)

```bash
# Se precisar forçar sincronização manual
git fetch origin
git checkout android
git reset --hard origin/dev

# Reaplicar configurações Android
./scripts/setup-android-branch.sh

git push origin android --force-with-lease
```

---

## 🌐 Deploys no Netlify

| Branch | Site | Propósito |
|--------|------|-----------|
| `dev` | meteor-dev.netlify.app | Preview/Staging |
| `main` | meteor.app | Produção |
| `android` | meteor-android.netlify.app | APK/TWA exclusivo |

### Por que separado?

- **Domínio diferente**: O TWA requer um domínio específico
- **Configurações diferentes**: Manifest e assets modificados
- **Testes isolados**: Pode testar o APK sem afetar produção
- **Asset Links**: Arquivo `/.well-known/assetlinks.json` específico

---

## 📁 Diferenças da Branch Android

### Arquivos Adicionais

```
android/
├── twa-manifest.json      # Configuração do TWA
├── build-apk.sh          # Script de build
├── README.md             # Documentação específica
└── android.keystore      # Certificado (gerado no build)

public/
└── assetlinks.json       # Validação do TWA com Play Store
```

### Modificações

| Arquivo | Mudança |
|---------|---------|
| `manifest.json` | URLs apontam para meteor-android.netlify.app |
| `index.html` | Meta tag `app-platform: twa-android` |
| `netlify.toml` | Configuração específica para o contexto android |

---

## 🚀 Setup Inicial

### 1. Criar a Branch (execute localmente)

```bash
# Na raiz do projeto
git checkout dev
git pull origin dev

# Executar script de setup
chmod +x scripts/setup-android-branch.sh
./scripts/setup-android-branch.sh

# O script irá:
# - Criar a branch android baseada na dev
# - Adicionar todos os arquivos necessários
# - Fazer commit inicial
```

### 2. Push da Branch

```bash
git push origin android
```

### 3. Configurar no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Selecione o repositório Meteor
4. Em **Branch to deploy**, selecione `android`
5. Configure:
   - **Build command**: `vite build`
   - **Publish directory**: `dist`
6. Clique em **Deploy site**
7. Renomeie o site para: `meteor-android`

### 4. Variáveis de Ambiente

No Netlify (site android), adicione:

```
VAPID_PUBLIC_KEY=seu_key_aqui
VAPID_PRIVATE_KEY=seu_key_aqui
FIREBASE_SERVER_KEY=opcional_para_fcm
NOTIFICATION_SECRET=segredo_para_endpoints
```

### 5. GitHub Actions

O workflow já está configurado em `.github/workflows/sync-android-branch.yml`.

Ele sincroniza automaticamente quando `dev` é atualizada.

---

## 📱 Gerando o APK

### Local

```bash
cd android
./build-apk.sh
```

### Resultado

```
android/app/app-release-signed.apk
```

### Instalar

```bash
adb install android/app/app-release-signed.apk
```

---

## 🔐 Asset Links (Importante!)

Para que o TWA funcione corretamente, você precisa do SHA256 fingerprint do keystore.

### Obter Fingerprint

```bash
cd android
keytool -list -v -keystore android.keystore -alias meteor -storepass meteor123
```

### Atualizar

Copie o SHA256 e atualize `public/assetlinks.json`:

```json
{
  "sha256_cert_fingerprints": [
    "AA:BB:CC:DD:EE:FF:...:11:22:33"
  ]
}
```

Commit e push na branch `android`.

---

## 🔄 Manutenção

### A branch android sempre está atualizada?

**Sim!** O GitHub Actions faz isso automaticamente quando:
- Alguém faz push na `dev`
- Um PR é mergeado na `dev`

### E se eu precisar modificar algo só no Android?

Você pode fazer commit direto na branch `android`:

```bash
git checkout android
# ... faz as modificações ...
git add .
git commit -m "fix: ajuste específico do TWA"
git push origin android
```

**Atenção**: Na próxima sincronização automática, essas mudanças serão mantidas (merge, não overwrite).

### Resetar a branch Android

Se precisar começar do zero:

```bash
./scripts/setup-android-branch.sh
git push origin android --force-with-lease
```

---

## 🐛 Troubleshooting

### "Branch android desatualizada"

```bash
# Forçar sincronização manual
git checkout android
git fetch origin
git reset --hard origin/dev
./scripts/setup-android-branch.sh
git push origin android --force-with-lease
```

### "Asset links não funcionam"

Verifique:
1. O arquivo `public/assetlinks.json` está no deploy?
2. Acessível em `https://meteor-android.netlify.app/.well-known/assetlinks.json`?
3. O SHA256 fingerprint está correto?
4. O `package_name` em `twa-manifest.json` corresponde?

### "APK abre no navegador"

Verifique se:
1. Asset links está correto
2. O app foi assinado com o mesmo keystore
3. O domínio é exatamente o que está no twa-manifest.json

---

## 📊 Resumo

| Pergunta | Resposta |
|----------|----------|
| Preciso commitar na android? | Não, é automático |
| Posso fazer push na android? | Sim, mudanças são preservadas |
| E se conflitar? | Resolva manualmente e push |
| Posso deletar a branch? | Não recomendado, mas pode recriar |
| Sites diferentes? | Sim, 3 deploys separados |

---

**Dúvidas?** Consulte os arquivos na pasta `android/` ou abra uma issue.
