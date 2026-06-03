#!/bin/bash

# Script de Setup Local - LeadScrap
# Este script configura tudo para rodar localmente

set -e

echo "🚀 LeadScrap - Setup Local"
echo "=================================="

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}[1/5]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js não encontrado. Instale em https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"

# Instalar dependências
echo -e "${BLUE}[2/5]${NC} Instalando dependências..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependências instaladas${NC}"
else
    echo -e "${GREEN}✓ node_modules já existe${NC}"
fi

# Verificar arquivo .env.local
echo -e "${BLUE}[3/5]${NC} Verificando variáveis de ambiente..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Criando .env.local de exemplo...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite .env.local com suas credenciais do Supabase${NC}"
    echo -e "${YELLOW}   - NEXT_PUBLIC_SUPABASE_URL${NC}"
    echo -e "${YELLOW}   - NEXT_PUBLIC_SUPABASE_ANON_KEY${NC}"
    exit 1
else
    echo -e "${GREEN}✓ .env.local encontrado${NC}"
fi

# Verificar uploads directory
echo -e "${BLUE}[4/5]${NC} Preparando diretórios..."
mkdir -p uploads
mkdir -p auth_info_baileys
echo -e "${GREEN}✓ Diretórios criados${NC}"

# Informações finais
echo -e "${BLUE}[5/5]${NC} Setup completo!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup concluído com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Próximos passos:"
echo ""
echo "1️⃣  Edite o arquivo .env.local com suas credenciais Supabase:"
echo -e "   ${YELLOW}nano .env.local${NC}"
echo ""
echo "2️⃣  Execute o schema SQL no Supabase Studio:"
echo -e "   ${YELLOW}scripts/admin_schema.sql${NC}"
echo ""
echo "3️⃣  Crie um usuário admin com:"
echo -e "   ${YELLOW}scripts/admin_queries.sql${NC}"
echo ""
echo "4️⃣  Inicie o desenvolvimento:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "5️⃣  Acesse:"
echo -e "   ${YELLOW}• Landing:     http://localhost:3000/landing${NC}"
echo -e "   ${YELLOW}• Dashboard:   http://localhost:3000${NC}"
echo -e "   ${YELLOW}• Admin:       http://localhost:3000/admin/login${NC}"
echo ""
echo -e "${BLUE}Documentação:${NC} Veja README.md e DEPLOYMENT.md"
echo ""
