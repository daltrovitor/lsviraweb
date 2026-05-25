-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user', -- 'user' ou 'admin'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT now(),
  last_access TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'idle', -- 'idle', 'running', 'paused', 'completed', 'stopped', 'scheduled'
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  total_contacts INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  pending_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'error'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  sent_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabela de histórico de acesso
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dashboard VARCHAR(50), -- 'main', 'admin'
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_contacts_campaign_id ON contacts(campaign_id);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);

-- Views para estatísticas
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.email,
  u.name,
  COUNT(DISTINCT c.id) as total_campaigns,
  COALESCE(SUM(c.total_contacts), 0) as total_contacts,
  COALESCE(SUM(c.sent_count), 0) as total_sent,
  COALESCE(SUM(CASE WHEN DATE(c.created_at) = CURRENT_DATE THEN c.sent_count ELSE 0 END), 0) as sent_today,
  u.last_access
FROM users u
LEFT JOIN campaigns c ON u.id = c.user_id
WHERE u.status = 'approved'
GROUP BY u.id, u.email, u.name, u.last_access;

-- Pendentes de aprovação
CREATE OR REPLACE VIEW pending_approvals AS
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
