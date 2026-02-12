#!/bin/bash
# ============================================
# Script de Setup do Firebase Cloud Messaging
# ============================================

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔥 Firebase Cloud Messaging Setup${NC}"
echo "==================================="
echo ""

echo -e "${YELLOW}Passos para configurar o FCM:${NC}"
echo ""
echo "1. Acesse: https://console.firebase.google.com"
echo "2. Crie um novo projeto chamado 'Meteor Weather'"
echo "3. Clique no ícone Android (</>) para adicionar app"
echo "   - Nome do pacote: app.meteor.weather"
echo "   - Apelido: Meteor"
echo "4. Baixe o arquivo google-services.json (guarde localmente)"
echo "5. Vá em Configurações do Projeto → Cloud Messaging"
echo "6. Copie a 'Chave do servidor' (Server Key)"
echo ""
echo -e "${YELLOW}Variáveis de ambiente necessárias no Netlify:${NC}"
echo ""
echo "FIREBASE_SERVER_KEY=AAAA... (sua chave do Firebase)"
echo "NOTIFICATION_SECRET=senha_segura_aleatoria"
echo ""

# Verificar se já tem configuração
if [ -f "google-services.json" ]; then
    echo -e "${GREEN}✓ google-services.json encontrado!${NC}"
    echo ""
    echo "Conteúdo do arquivo:"
    cat google-services.json | grep -E '"project_id"|"package_name"|"app_id"' || true
else
    echo -e "${YELLOW}⚠ google-services.json não encontrado${NC}"
    echo "   Cole o arquivo aqui quando baixar do Firebase"
fi

echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Configure as variáveis no Netlify"
echo "2. Atualize o index.html com o Firebase SDK"
echo "3. Teste enviando uma notificação"
echo ""
echo "Documentação completa: FCM_SETUP.md"
