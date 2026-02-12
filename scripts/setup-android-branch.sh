#!/bin/bash
# ============================================
# Script de Setup da Branch Android
# ============================================
# Este script configura a branch android com os arquivos
# necessários para gerar o APK. Deve ser executado apenas
# na primeira vez ou quando quiser resetar a branch.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌩️  Meteor Android Branch Setup${NC}"
echo "=================================="
echo ""

# Verificar se estamos no repo correto
if [ ! -f "package.json" ] || ! grep -q '"name": "meteor"' package.json 2>/dev/null; then
    echo -e "${RED}✗ Execute este script na raiz do projeto Meteor${NC}"
    exit 1
fi

# Salvar arquivos Android atuais (se existirem)
ANDROID_FILES_EXIST=false
if [ -d "android" ] && [ -f "android/twa-manifest.json" ]; then
    ANDROID_FILES_EXIST=true
    echo -e "${YELLOW}💾 Salvando arquivos Android atuais...${NC}"
    cp -r android /tmp/meteor-android-backup
fi

# Criar branch android baseada na dev
echo -e "${BLUE}📦 Criando branch android...${NC}"
git fetch origin

# Verificar se branch existe
if git show-ref --verify --quiet refs/heads/android; then
    echo -e "${YELLOW}Branch android local existe. Resetando...${NC}"
    git checkout android
    git reset --hard origin/dev
else
    git checkout -b android origin/dev
fi

# Restaurar arquivos Android
if [ "$ANDROID_FILES_EXIST" = true ]; then
    echo -e "${BLUE}📁 Restaurando arquivos Android...${NC}"
    rm -rf android
    cp -r /tmp/meteor-android-backup android
    rm -rf /tmp/meteor-android-backup
else
    echo -e "${YELLOW}⚠️ Arquivos Android não encontrados no backup.${NC}"
    echo "   Criando estrutura básica..."
    mkdir -p android
fi

# Garantir que os arquivos essenciais existam
echo -e "${BLUE}📝 Verificando arquivos essenciais...${NC}"

# Criar arquivos se não existirem
[ ! -f "android/twa-manifest.json" ] && cat > android/twa-manifest.json << 'EOF'
{
  "packageId": "app.meteor.weather",
  "host": "meteor-android.netlify.app",
  "name": "Meteor",
  "launcherName": "Meteor",
  "display": "standalone",
  "themeColor": "#131B2E",
  "navigationColor": "#131B2E",
  "navigationColorDark": "#131B2E",
  "navigationDividerColor": "#131B2E",
  "navigationDividerColorDark": "#131B2E",
  "backgroundColor": "#111827",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://meteor-android.netlify.app/favicon.svg",
  "maskableIconUrl": "https://meteor-android.netlify.app/favicon.svg",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "meteor"
  },
  "appVersionName": "5.6.0",
  "appVersionCode": 56,
  "shortcuts": [
    {
      "name": "Previsão",
      "shortName": "Previsão",
      "description": "Ver previsão do tempo",
      "url": "/",
      "icon": "https://meteor-android.netlify.app/favicon.svg"
    },
    {
      "name": "Alertas",
      "shortName": "Alertas",
      "description": "Ver alertas meteorológicos",
      "url": "/?view=alerts",
      "icon": "https://meteor-android.netlify.app/favicon.svg"
    }
  ],
  "generatorApp": "bubblewrap-cli"
}
EOF

[ ! -f "android/build-apk.sh" ] && cat > android/build-apk.sh << 'EOF'
#!/bin/bash
# Build script para APK Meteor
set -e
echo "🌩️  Meteor APK Build"
if ! command -v bubblewrap &> /dev/null; then
    echo "Instalando Bubblewrap..."
    npm install -g @bubblewrap/cli
fi
if [ ! -f "android.keystore" ]; then
    echo "Gerando keystore..."
    keytool -genkey -v -keystore android.keystore -alias meteor -keyalg RSA -keysize 2048 -validity 10000 -storepass meteor123 -keypass meteor123 -dname "CN=Meteor, OU=Dev, O=Meteor, L=Sao Paulo, ST=SP, C=BR"
fi
if [ ! -d "./app" ]; then
    bubblewrap init --manifest https://meteor-android.netlify.app/manifest.json --directory ./app
fi
cd app && bubblewrap build
echo "✅ APK gerado em: ./app/app-release-signed.apk"
EOF
chmod +x android/build-apk.sh

[ ! -f "android/README.md" ] && cat > android/README.md << 'EOF'
# Meteor Android

Branch dedicada para build do APK Android.

Esta branch é automaticamente sincronizada com `dev` via GitHub Actions.

## Gerar APK

```bash
cd android
./build-apk.sh
```

## Deploy

Site: https://meteor-android.netlify.app
EOF

# Atualizar manifest.json para o domínio Android
echo -e "${BLUE}🌐 Atualizando manifest.json para domínio Android...${NC}"
if [ -f "manifest.json" ]; then
    # Fazer backup do original
    cp manifest.json manifest.json.backup
    
    # Atualizar URLs para o domínio Android
    sed -i 's|"https://[^"]*|"https://meteor-android.netlify.app|g' manifest.json 2>/dev/null || true
fi

# Adicionar tag de identificação no index.html
echo -e "${BLUE}🏷️  Adicionando meta tag de identificação TWA...${NC}"
if [ -f "index.html" ] && ! grep -q "twa-android" index.html; then
    # Adicionar meta tag antes do </head>
    sed -i 's|</head>|<meta name="app-platform" content="twa-android" />\n</head>|' index.html 2>/dev/null || true
fi

# Adicionar arquivo de configuração do Netlify para branch android
echo -e "${BLUE}⚙️  Criando netlify.toml para branch android...${NC}"
cat > netlify.toml << 'EOF'
[build]
  command = "vite build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/.well-known/assetlinks.json"
  [headers.values]
    Content-Type = "application/json"
    Access-Control-Allow-Origin = "*"

[[redirects]]
  from = "/.well-known/assetlinks.json"
  to = "/assetlinks.json"
  status = 200

[context.android]
  command = "vite build"
  
  [context.android.environment]
    VAPID_PUBLIC_KEY = "${VAPID_PUBLIC_KEY}"
EOF

# Criar assetlinks.json para TWA
echo -e "${BLUE}🔐 Criando assetlinks.json...${NC}"
mkdir -p public
cat > public/assetlinks.json << 'EOF'
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.meteor.weather",
    "sha256_cert_fingerprints": [
      "REPLACE_WITH_YOUR_SHA256_FINGERPRINT"
    ]
  }
}]
EOF

git add -A
git commit -m "🔧 Setup: Configuração inicial da branch Android

- Adiciona arquivos TWA (Trusted Web Activity)
- Configura domínio meteor-android.netlify.app
- Adiciona scripts de build do APK
- Configura assetlinks.json para validação
- Mantém compatibilidade com branch dev" || echo "Nada para commitar"

echo ""
echo -e "${GREEN}✅ Branch android configurada!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Push da branch: git push origin android --force-with-lease"
echo "  2. Configure o site no Netlify: https://app.netlify.com"
echo "  3. Conecte o repositório e selecione a branch 'android'"
echo "  4. Configure o domínio: meteor-android.netlify.app"
echo "  5. Adicione as variáveis de ambiente (VAPID, Firebase, etc.)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   Guarde o arquivo android/android.keystore!"
echo "   Ele será gerado no primeiro build."
echo ""
