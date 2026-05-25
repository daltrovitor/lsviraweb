import express from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../utils/supabase';

const router = express.Router();

// Registro de novo usuário (pendente de aprovação)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, company, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está registrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar novo usuário com status 'pending'
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        company: company || null,
        phone: phone || null,
        status: 'pending',
        role: 'user'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro ao criar conta' });
    }

    res.status(201).json({
      message: 'Conta criada com sucesso! Aguarde a aprovação da equipe.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao processar registro' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Sua conta ainda não foi aprovada ou foi rejeitada.',
        status: user.status
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Atualizar último acesso
    await supabaseAdmin
      .from('users')
      .update({ last_access: new Date().toISOString() })
      .eq('id', user.id);

    // Registrar acesso
    await supabaseAdmin.from('access_logs').insert({
      user_id: user.id,
      dashboard: 'main',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

export default router;
