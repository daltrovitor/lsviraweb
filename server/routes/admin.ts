import express from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { User, AdminStats, PendingApproval } from '../types';

const router = express.Router();

// Middleware para verificar se é admin
const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!userId || !token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single();

    if (error || !user || user.role !== 'admin' || user.status !== 'approved') {
      return res.status(403).json({ error: 'Acesso negado. Apenas admins.' });
    }

    (req as any).userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro na verificação de permissões' });
  }
};

// Obter usuários pendentes de aprovação
router.get('/pending-approvals', isAdmin, async (req, res) => {
  try {
    const { data: pendingUsers, error } = await supabaseAdmin
      .from('pending_approvals')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar aprovações pendentes:', error);
      return res.status(500).json({ error: 'Erro ao buscar aprovações' });
    }

    res.json({ users: pendingUsers });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

// Aprovar usuário
router.post('/approve-user/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).userId;

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao aprovar usuário:', error);
      return res.status(500).json({ error: 'Erro ao aprovar usuário' });
    }

    // Registrar ação
    await supabaseAdmin.from('access_logs').insert({
      user_id: adminId,
      dashboard: 'admin',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Usuário aprovado com sucesso' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

// Rejeitar usuário
router.post('/reject-user/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).userId;

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        status: 'rejected',
        rejected_reason: reason || 'Rejeitado pela equipe',
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao rejeitar usuário:', error);
      return res.status(500).json({ error: 'Erro ao rejeitar usuário' });
    }

    res.json({ message: 'Usuário rejeitado' });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

// Obter estatísticas do admin
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const adminId = (req as any).userId;

    // Registrar acesso ao painel de admin
    await supabaseAdmin
      .from('users')
      .update({ last_access: new Date().toISOString() })
      .eq('id', adminId);

    await supabaseAdmin.from('access_logs').insert({
      user_id: adminId,
      dashboard: 'admin',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Total de usuários aprovados
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('status', 'approved')
      .eq('role', 'user');

    // Aprovações pendentes
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_approvals')
      .select('*');

    // Campanhas de hoje
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysCampaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('total_contacts, sent_count')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    const stats: AdminStats = {
      total_users: users?.length || 0,
      pending_approvals: pending?.length || 0,
      total_campaigns_today: todaysCampaigns?.length || 0,
      total_contacts_today: todaysCampaigns?.reduce((sum, c) => sum + (c.total_contacts || 0), 0) || 0,
      total_sent_today: todaysCampaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0,
      pending_approvals_list: (pending || []) as PendingApproval[]
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Obter todos os usuários
router.get('/users', isAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, company, phone, role, status, created_at, last_access')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
});

export default router;
