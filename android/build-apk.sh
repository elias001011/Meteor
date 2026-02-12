#!/bin/bash

# ============================================
# Script de Build do APK para Meteor
# Usando Bubblewrap (TWA - Trusted Web Activity)
# ============================================

set -e

echo "🌩️  Meteor APK Build Script"
echo "============================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se o Bubblewrap está instalado
check_bubblewrap() {
    if ! command -v bubblewrap &> /dev/null; then
        echo -e "${YELLOW}Bubblewrap não encontrado. Instalando...${NC}"
        npm install -g @bubblewrap/cli
    else
        echo -e "${GREEN}✓ Bubblewrap encontrado${NC}"
    fi
}

# Verificar Java
check_java() {
    if ! command -v java &> /dev/null; then
        echo -e "${RED}✗ Java não encontrado. Por favor, instale o JDK 11 ou superior.${NC}"
        echo "   Ubuntu/Debian: sudo apt install openjdk-11-jdk"
        echo "   macOS: brew install openjdk@11"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 11 ]; then
        echo -e "${RED}✗ Java 11+ necessário. Versão encontrada: $JAVA_VERSION${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Java $JAVA_VERSION encontrado${NC}"
}

# Verificar Android SDK
check_android_sdk() {
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        echo -e "${YELLOW}⚠ ANDROID_HOME não configurado${NC}"
        echo "   Configurando Android SDK padrão..."
        
        # Tentar encontrar Android SDK em locais comuns
        if [ -d "$HOME/Android/Sdk" ]; then
            export ANDROID_HOME="$HOME/Android/Sdk"
        elif [ -d "$HOME/Library/Android/sdk" ]; then
            export ANDROID_HOME="$HOME/Library/Android/sdk"
        elif [ -d "/usr/local/android-sdk" ]; then
            export ANDROID_HOME="/usr/local/android-sdk"
        else
            echo -e "${RED}✗ Android SDK não encontrado${NC}"
            echo "   Por favor, instale o Android Studio ou o Android SDK Command Line Tools"
            exit 1
        fi
        
        export ANDROID_SDK_ROOT="$ANDROID_HOME"
        export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
    fi
    echo -e "${GREEN}✓ Android SDK: $ANDROID_HOME${NC}"
}

# Gerar keystore se não existir
generate_keystore() {
    if [ ! -f "android.keystore" ]; then
        echo -e "${YELLOW}⚠ Keystore não encontrado. Gerando novo...${NC}"
        
        # Gerar keystore
        keytool -genkey -v \
            -keystore android.keystore \
            -alias meteor \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -storepass meteor123 \
            -keypass meteor123 \
            -dname "CN=Meteor Weather App, OU=Development, O=Meteor, L=Sao Paulo, ST=SP, C=BR"
        
        echo -e "${GREEN}✓ Keystore gerado: android.keystore${NC}"
        echo -e "${YELLOW}⚠ Guarde este arquivo em local seguro! Ele é necessário para atualizar o app.${NC}"
    else
        echo -e "${GREEN}✓ Keystore encontrado${NC}"
    fi
}

# Build do APK
build_apk() {
    echo ""
    echo "🔨 Iniciando build do APK..."
    echo ""
    
    # Verificar se já existe projeto TWA
    if [ ! -d "./app" ]; then
        echo "📦 Inicializando projeto TWA..."
        bubblewrap init --manifest https://meteor.app/manifest.json \
            --directory ./app \
            --host meteor.app \
            --package app.meteor.weather \
            --name "Meteor" \
            --display standalone \
            --themeColor "#131B2E" \
            --backgroundColor "#111827" \
            --enableNotifications
    fi
    
    # Build
    cd app
    bubblewrap build --skipPwaValidation
    
    echo ""
    echo -e "${GREEN}✅ Build concluído!${NC}"
    echo ""
    echo "📱 APK gerado em:"
    echo "   ./app/app-release-signed.apk"
    echo ""
    echo "📋 Informações do APK:"
    ls -lh app-release-signed.apk
    echo ""
    echo -e "${YELLOW}⚠ Importante:${NC}"
    echo "   - Guarde o arquivo android.keystore em local seguro"
    echo "   - Use o mesmo keystore para todas as atualizações"
    echo "   - Para publicar na Play Store, use o Android App Bundle (AAB)"
}

# Build AAB (Android App Bundle) para Play Store
build_aab() {
    echo ""
    echo "🔨 Iniciando build do AAB (Android App Bundle)..."
    echo ""
    
    cd app
    bubblewrap build --skipPwaValidation --format aab
    
    echo ""
    echo -e "${GREEN}✅ AAB gerado!${NC}"
    echo ""
    echo "📱 App Bundle gerado em:"
    echo "   ./app/app-release-bundle.aab"
}

# Função principal
main() {
    echo ""
    
    case "${1:-build}" in
        "init")
            check_bubblewrap
            check_java
            check_android_sdk
            generate_keystore
            ;;
        "build")
            check_bubblewrap
            check_java
            check_android_sdk
            generate_keystore
            build_apk
            ;;
        "aab")
            check_bubblewrap
            check_java
            check_android_sdk
            generate_keystore
            build_aab
            ;;
        "clean")
            echo "🧹 Limpando arquivos de build..."
            rm -rf ./app
            echo -e "${GREEN}✓ Diretório ./app removido${NC}"
            ;;
        *)
            echo "Uso: $0 [init|build|aab|clean]"
            echo ""
            echo "Comandos:"
            echo "  init   - Verifica e instala dependências"
            echo "  build  - Gera o APK (padrão)"
            echo "  aab    - Gera o Android App Bundle para Play Store"
            echo "  clean  - Remove arquivos de build"
            exit 1
            ;;
    esac
}

main "$@"
