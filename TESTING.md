# 🧪 Guia de Testes - LeadScrap

## Pré-requisitos
- Node.js v18+
- Supabase account (gratuito)
- Vercel account (gratuito)

## 📋 Checklist de Testes

### 1. Setup Inicial

- [ ] Clonar/copiar projeto
- [ ] Rodar `npm install`
- [ ] Configurar `.env.local` com credenciais Supabase
- [ ] Executar schema SQL no Supabase
- [ ] Criar admin inicial via SQL

### 2. Testes de Autenticação

#### 2.1 Registro de Novo Usuário

**Passos:**
1. Acessar http://localhost:3000/landing
2. Clicar na tab "Cadastro"
3. Preencher formulário:
   - Nome: "João Teste"
   - Email: "joao@test.com"
   - Empresa: "Empresa Teste"
   - WhatsApp: "(62) 99999-9999"
   - Senha: "senha123"
4. Clicar em "Criar Conta"

**Resultado esperado:**
- ✅ Mensagem: "Conta criada com sucesso!"
- ✅ Usuário aparece em Supabase > users com status `pending`
- ✅ Refresh mostra tab de informações

#### 2.2 Tentativa de Login (Usuário Pendente)

**Passos:**
1. Acessar http://localhost:3000
2. Tentar fazer login com: joao@test.com / senha123

**Resultado esperado:**
- ✅ Erro: "Sua conta ainda não foi aprovada"
- ❌ Não é permitido acessar o dashboard

### 3. Testes de Admin Dashboard

#### 3.1 Login de Admin

**Passos:**
1. Acessar http://localhost:3000/admin/login
2. Fazer login com:
   - Email: admin@viraweb.online
   - Senha: (a senha que você definiu)

**Resultado esperado:**
- ✅ Redirecionamento para /admin/dashboard
- ✅ Painel mostra estatísticas
- ✅ Tab "Aprovações" mostra o usuário "João Teste" como pendente

#### 3.2 Aprovar Usuário

**Passos:**
1. Em Admin Dashboard, acessar tab "Aprovações"
2. Clicar em "Aprovar" para João Teste
3. Aguardar processamento

**Resultado esperado:**
- ✅ Mensagem: "Usuário aprovado!"
- ✅ Usuário desaparece da lista de pendentes
- ✅ Status em Supabase muda para `approved`

#### 3.3 Rejeitar Usuário (Teste Alternativo)

**Passos:**
1. Registrar novo usuário (Maria Teste)
2. Em Admin Dashboard, clicar "Rejeitar"
3. Digitar motivo (opcional)

**Resultado esperado:**
- ✅ Usuário rejeitado
- ✅ Status em Supabase = `rejected`
- ✅ Tentativa de login mostra erro

### 4. Testes de Dashboard Principal

#### 4.1 Login após Aprovação

**Passos:**
1. Acessar http://localhost:3000
2. Fazer login: joao@test.com / senha123

**Resultado esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionamento para dashboard
- ✅ Painel mostra: QR Code, Métricas, Editor de Mensagem

#### 4.2 Conectar WhatsApp

**Passos:**
1. No dashboard, aguardar QR Code aparecer
2. Abrir WhatsApp no celular
3. Configurações > Dispositivos Conectados > Conectar Dispositivo
4. Escanear QR Code

**Resultado esperado:**
- ✅ Badge "Conectado" fica verde
- ✅ Nome do celular aparece no painel
- ✅ Botão "Iniciar Disparo" fica habilitado

### 5. Testes de Upload CSV

#### 5.1 Upload de Arquivo CSV

**Passos:**
1. No dashboard, seção "Colar Destinatários"
2. Clicar em "Upload CSV"
3. Selecionar arquivo `example_contacts.csv`
4. Aguardar processamento

**Resultado esperado:**
- ✅ Botão mostra "Enviando..."
- ✅ Mensagem: "X contatos importados com sucesso!"
- ✅ Tabela "Fila de Destinatários" mostra contatos
- ✅ Métrica "Total Fila" atualizada

#### 5.2 Cola Manual de Contatos

**Passos:**
1. No textarea "Colar Destinatários", colar:
   ```
   11988887777,João
   11966665555,Maria
   ```
2. Clicar "Colar Lista"

**Resultado esperado:**
- ✅ Contatos adicionados à fila
- ✅ Métrica "Total Fila" aumentada
- ✅ Status "pending" para cada contato

### 6. Testes de Campanhas

#### 6.1 Criar e Iniciar Campanha

**Passos:**
1. No editor de mensagem, digitar:
   ```
   Olá {nome}, tudo bem? Teste de disparo.
   ```
2. Adicionar contatos (via CSV ou manual)
3. Clicar "Iniciar Disparo"
4. Aguardar processamento

**Resultado esperado:**
- ✅ Status muda para "running"
- ✅ Overlay flutuante mostra progresso
- ✅ Métrica "Enviados" aumenta
- ✅ Contatos recebem mensagens no WhatsApp

#### 6.2 Pausar e Retomar Campanha

**Passos:**
1. Durante um disparo, clicar botão "Pausar"
2. Aguardar pausa
3. Clicar "Retomar"

**Resultado esperado:**
- ✅ Disparos pausam
- ✅ Botão muda para "Retomar"
- ✅ Ao retomar, continua de onde parou

#### 6.3 Parar Campanha

**Passos:**
1. Clicar botão "Parar" durante um disparo

**Resultado esperado:**
- ✅ Status muda para "stopped"
- ✅ Disparos param imediatamente
- ✅ Contatos restantes continuam "pending"

### 7. Testes de Métricas

#### 7.1 Admin Dashboard - Estatísticas

**Passos:**
1. Registrar 3 novos usuários
2. Aprovar 2 deles
3. Fazer disparo de campanha com 10 contatos
4. Acessar Admin Dashboard > Visão Geral

**Resultado esperado:**
- ✅ "Total de Usuários" = 2 (apenas aprovados)
- ✅ "Pendentes" = 1
- ✅ "Disparos Hoje" = 10 (ou quantidade enviada)
- ✅ "Contatos Hoje" = 10

#### 7.2 Último Acesso

**Passos:**
1. Fazer login em http://localhost:3000
2. Ir para Admin Dashboard > Usuários
3. Verificar coluna "Último Acesso"

**Resultado esperado:**
- ✅ Timestamp atualizado
- ✅ Admin Dashboard > Usuários mostra horário recente

### 8. Testes de Validação

#### 8.1 Validação de Número

**Passos:**
1. Tentar colar número inválido:
   ```
   123,João
   abcdef,Maria
   ```
2. Clicar "Colar Lista"

**Resultado esperado:**
- ✅ Apenas números válidos são importados
- ✅ Números sanitizados (removem caracteres especiais)
- ✅ Alerta mostra quantos foram válidos

#### 8.2 Validação de Email

**Passos:**
1. Tentar registrar com email inválido: "naoehum.email"

**Resultado esperado:**
- ✅ Erro: "Email inválido"
- ❌ Não cria conta

#### 8.3 Email Duplicado

**Passos:**
1. Registrar conta: joao@test.com
2. Tentar registrar novamente: joao@test.com

**Resultado esperado:**
- ✅ Erro: "Este email já está registrado"

### 9. Testes de Segurança

#### 9.1 Acesso sem Autenticação

**Passos:**
1. Acessar http://localhost:3000 sem login

**Resultado esperado:**
- ✅ Redirecionamento para tela de login (se Supabase ativado)

#### 9.2 Acesso Admin sem Role

**Passos:**
1. Fazer login com usuário comum (não admin)
2. Tentar acessar http://localhost:3000/admin/login
3. Tentar acessar http://localhost:3000/admin/dashboard (via URL direta)

**Resultado esperado:**
- ✅ Erro: "Acesso negado"
- ✅ Redirecionamento para login

### 10. Testes de Performance

#### 10.1 Upload de Grande CSV

**Passos:**
1. Criar CSV com 1000+ contatos
2. Fazer upload

**Resultado esperado:**
- ✅ Upload concluído em <5 segundos
- ✅ Todos os contatos importados
- ✅ UI responsiva

#### 10.2 Fila com Muitos Contatos

**Passos:**
1. Importar 5000 contatos
2. Iniciar disparo
3. Verificar se a tabela de fila é responsiva

**Resultado esperado:**
- ✅ Tabela mostra os 100 primeiros contatos
- ✅ Scroll fluido
- ✅ Sem travamentos

## 🐛 Problemas Comuns e Soluções

### Problema: "Supabase não está configurado"
**Solução:** Verificar `.env.local` com credenciais corretas

### Problema: QR Code não aparece
**Solução:** 
- Verificar se backend está rodando (`npm run dev`)
- Verificar conexão Socket.io
- Abrir DevTools > Console para erros

### Problema: Contatos não chegam
**Solução:**
- Verificar se WhatsApp está conectado (badge verde)
- Verificar se números estão no formato correto (apenas dígitos)
- Testar manualmente enviando uma mensagem

### Problema: Admin não consegue aprovar
**Solução:**
- Verificar se usuário tem role = 'admin'
- Verificar credenciais SUPABASE_SERVICE_KEY

## ✅ Conclusão

Se todos os testes passarem, o sistema está pronto para:
1. Deploy na Vercel
2. Configuração de domínios customizados
3. Uso em produção

---

**Data**: 2024-05-24  
**Versão**: 1.0
