-- ============================================
-- Script para criar usuário ADMIN inicial
-- ============================================

-- PASSO 1: Gerar hash de senha segura
-- Use este comando no terminal Node.js:
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('sua_senha_forte_aqui', 10))"

-- PASSO 2: Substituir 'HASH_AQUI' pelo hash gerado acima
-- PASSO 3: Executar este SQL no Supabase Studio > SQL Editor

INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  company,
  phone,
  role,
  status,
  approved_by,
  approved_at,
  created_at,
  last_access
) VALUES (
  gen_random_uuid(),
  'admin@viraweb.online',
  'HASH_AQUI',
  'Administrador ViraWeb',
  'ViraWeb',
  '+55 62 9 9246-6109',
  'admin',
  'approved',
  NULL,
  now(),
  now(),
  now()
);

-- ============================================
-- Verificar se foi criado:
-- ============================================

SELECT id, email, name, role, status FROM users WHERE email = 'admin@viraweb.online';

-- ============================================
-- Listar todos os usuários:
-- ============================================

SELECT 
  id,
  email,
  name,
  role,
  status,
  created_at,
  last_access
FROM users
ORDER BY created_at DESC;

-- ============================================
-- Listar usuários pendentes de aprovação:
-- ============================================

SELECT 
  id,
  email,
  name,
  company,
  phone,
  created_at,
  EXTRACT(HOUR FROM (now() - created_at))::INT as hours_pending
FROM users
WHERE status = 'pending'
ORDER BY created_at ASC;

-- ============================================
-- Estatísticas do sistema:
-- ============================================

SELECT 
  (SELECT COUNT(*) FROM users WHERE status = 'approved' AND role = 'user') as total_usuarios_aprovados,
  (SELECT COUNT(*) FROM users WHERE status = 'pending') as pendentes_aprovacao,
  (SELECT COUNT(*) FROM campaigns WHERE DATE(created_at) = CURRENT_DATE) as campanhas_hoje,
  (SELECT COALESCE(SUM(total_contacts), 0) FROM campaigns WHERE DATE(created_at) = CURRENT_DATE) as contatos_hoje,
  (SELECT COALESCE(SUM(sent_count), 0) FROM campaigns WHERE DATE(created_at) = CURRENT_DATE) as disparos_hoje;

-- ============================================
-- Campanhas de um usuário:
-- ============================================

SELECT 
  id,
  title,
  status,
  total_contacts,
  sent_count,
  error_count,
  created_at
FROM campaigns
WHERE user_id = 'USER_ID_AQUI'
ORDER BY created_at DESC;

-- ============================================
-- Contatos de uma campanha:
-- ============================================

SELECT 
  number,
  name,
  status,
  sent_at
FROM contacts
WHERE campaign_id = 'CAMPAIGN_ID_AQUI'
LIMIT 100;

-- ============================================
-- Resetar senha de um admin (se esquecer):
-- ============================================

-- 1. Gerar novo hash com: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('nova_senha', 10))"
-- 2. Executar:

UPDATE users 
SET password_hash = 'NOVO_HASH_AQUI'
WHERE email = 'admin@viraweb.online';

-- ============================================
-- Deletar usuário rejeitado:
-- ============================================

DELETE FROM users WHERE id = 'USER_ID_AQUI' AND status = 'rejected';

-- ============================================
-- Logs de acesso:
-- ============================================

SELECT 
  u.email,
  al.dashboard,
  al.ip_address,
  al.created_at
FROM access_logs al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;

-- ============================================
-- Ativar/Desativar usuário:
-- ============================================

-- Desativar (rejeitar):
UPDATE users 
SET status = 'rejected', rejected_reason = 'Desativado administrativamente'
WHERE id = 'USER_ID_AQUI';

-- Ativar novamente:
UPDATE users 
SET status = 'approved', rejected_reason = NULL
WHERE id = 'USER_ID_AQUI';

-- ============================================
-- Backup de dados (executar periodicamente):
-- ============================================

\COPY (SELECT * FROM users) TO 'users_backup.csv' WITH (FORMAT csv, HEADER);
\COPY (SELECT * FROM campaigns) TO 'campaigns_backup.csv' WITH (FORMAT csv, HEADER);
\COPY (SELECT * FROM contacts) TO 'contacts_backup.csv' WITH (FORMAT csv, HEADER);
