// src/app/api/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente admin para ignorar RLS nas consultas do webhook de background
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== supabaseServiceKey) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, sender, message, pushName } = body;

    if (!userId || !sender || !message) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    // 1. Sanitizar o número do cliente (somente dígitos)
    const cleanPhone = sender.replace(/\D/g, '');
    const userMessage = message.trim();

    console.log(`[Webhook Chatbot] Processando msg de ${cleanPhone} para usuário ${userId}: "${userMessage}"`);

    // Obter o gerenciador global do WhatsApp
    const globalWhatsappManager = (global as any).whatsappManager;
    if (!globalWhatsappManager) {
      console.error('[Webhook Chatbot] Gerenciador global de WhatsApp não encontrado');
      return NextResponse.json({ error: 'Serviço offline' }, { status: 500 });
    }

    const waService = globalWhatsappManager.getService(userId);
    if (!waService || !waService.getStatus().connected) {
      console.warn(`[Webhook Chatbot] WhatsApp não conectado para o usuário ${userId}`);
      return NextResponse.json({ error: 'WhatsApp desconectado' }, { status: 500 });
    }

    // Função auxiliar para enviar resposta
    const sendResponse = async (text: string) => {
      try {
        await waService.sendMessage(cleanPhone, text);
        console.log(`[Webhook Chatbot] Resposta enviada para ${cleanPhone}: "${text.substring(0, 40)}..."`);
      } catch (err: any) {
        console.error(`[Webhook Chatbot] Erro ao enviar mensagem para ${cleanPhone}:`, err.message);
      }
    };

    // 2. Buscar a sessão atual do cliente
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('customer_chat_status')
      .select('*')
      .eq('user_id', userId)
      .eq('customer_phone', cleanPhone)
      .maybeSingle();

    if (sessionErr) {
      console.error('[Webhook Chatbot] Erro ao buscar sessão:', sessionErr.message);
      return NextResponse.json({ error: 'Erro no banco' }, { status: 500 });
    }

    // Se estiver no status HUMANO, silencia o chatbot completamente
    if (session && session.status === 'HUMANO') {
      console.log(`[Webhook Chatbot] Sessão em modo HUMANO para ${cleanPhone}. Chatbot ignorando.`);
      return NextResponse.json({ success: true, mode: 'HUMANO' });
    }

    // ==========================================
    // FLUXO A: BOT DE CAMPANHA (CAMPANHA_PENDENTE)
    // ==========================================
    if (session && session.status === 'CAMPANHA_PENDENTE' && session.campaign_id) {
      console.log(`[Webhook Chatbot] Cliente ${cleanPhone} está em fluxo ativo de campanha.`);

      // Obter o passo atual do bot de campanha
      const { data: currentStep, error: stepErr } = await supabaseAdmin
        .from('bot_steps')
        .select('*')
        .eq('user_id', userId)
        .eq('campaign_id', session.campaign_id)
        .eq('step_key', session.current_step_key || 'start')
        .maybeSingle();

      if (stepErr || !currentStep) {
        console.warn(`[Webhook Chatbot] Passo ${session.current_step_key} não encontrado para campanha ${session.campaign_id}. Redirecionando para o bot geral.`);
        // Transicionar para o bot geral
        await supabaseAdmin
          .from('customer_chat_status')
          .update({
            status: 'GERAL',
            campaign_id: null,
            current_step_key: 'start',
            last_interaction_at: new Date().toISOString(),
          })
          .eq('id', session.id);
        
        // Iniciar fluxo geral
        return await startGeneralFlow(userId, cleanPhone, session.id);
      }

      // Analisar opções do passo atual da campanha
      const options = currentStep.options || [];
      let nextStepKey: string | null = null;
      let matchedOption: any = null;

      // 1. Procurar correspondência exata
      matchedOption = options.find((opt: any) => {
        const trigger = String(opt.trigger).trim().toLowerCase();
        const input = userMessage.toLowerCase();
        return trigger === input;
      });

      // 2. Se não houver correspondência exata, procurar por contém ou palavra-chave
      if (!matchedOption) {
        matchedOption = options.find((opt: any) => {
          const trigger = String(opt.trigger).trim().toLowerCase();
          const input = userMessage.toLowerCase();
          return input.includes(trigger) && trigger.length > 2; // Evitar match de triggers muito curtos (ex: números)
        });
      }

      // 3. Se não houver match, procurar por wildcard/fallback
      if (!matchedOption) {
        matchedOption = options.find((opt: any) => opt.trigger === '*' || opt.trigger === 'default' || opt.trigger === 'fallback');
      }

      if (matchedOption) {
        nextStepKey = matchedOption.next_step;
      }

      if (nextStepKey) {
        // Obter os detalhes do próximo passo
        const { data: nextStep, error: nextStepErr } = await supabaseAdmin
          .from('bot_steps')
          .select('*')
          .eq('user_id', userId)
          .eq('campaign_id', session.campaign_id)
          .eq('step_key', nextStepKey)
          .maybeSingle();

        if (nextStepErr || !nextStep) {
          // Se for uma folha final/conclusão de fluxo de campanha
          console.log(`[Webhook Chatbot] Passo ${nextStepKey} é terminal ou não cadastrado. Finalizando fluxo da campanha.`);
          
          await supabaseAdmin
            .from('customer_chat_status')
            .update({
              status: 'GERAL',
              campaign_id: null,
              current_step_key: 'start',
              last_interaction_at: new Date().toISOString(),
            })
            .eq('id', session.id);

          // Avisar e iniciar fluxo geral
          return await startGeneralFlow(userId, cleanPhone, session.id);
        }

        // Se o próximo passo solicitar transição para humano
        if (nextStep.step_key.toLowerCase().includes('humano') || nextStepKey === 'humano') {
          await supabaseAdmin
            .from('customer_chat_status')
            .update({
              status: 'HUMANO',
              last_interaction_at: new Date().toISOString(),
            })
            .eq('id', session.id);

          await sendResponse(nextStep.message_text);
          return NextResponse.json({ success: true, mode: 'TRANSICAO_HUMANO' });
        }

        // Enviar a mensagem do próximo passo
        await sendResponse(nextStep.message_text);

        // Atualizar sessão para o próximo passo
        const hasSubsequentOptions = nextStep.options && nextStep.options.length > 0;
        await supabaseAdmin
          .from('customer_chat_status')
          .update({
            current_step_key: nextStepKey,
            status: hasSubsequentOptions ? 'CAMPANHA_PENDENTE' : 'GERAL', // Se não houver mais opções, volta para o bot geral na próxima interação
            campaign_id: hasSubsequentOptions ? session.campaign_id : null,
            last_interaction_at: new Date().toISOString(),
          })
          .eq('id', session.id);

        return NextResponse.json({ success: true, campaign_step: nextStepKey });
      } else {
        // Enviar mensagem de fallback / repetir opções atuais
        const fallbackMsg = `Desculpe, não entendi sua resposta.\n\n${currentStep.message_text}`;
        await sendResponse(fallbackMsg);
        return NextResponse.json({ success: true, campaign_step: 'fallback_repeated' });
      }
    }

    // ==========================================
    // FLUXO B: BOT DE ATENDIMENTO GERAL (GERAL)
    // ==========================================
    if (session && session.status === 'GERAL') {
      return await handleGeneralBotFlow(userId, cleanPhone, session.id, userMessage, session.current_step_key);
    }

    // ==========================================
    // SESSÃO INEXISTENTE: IDENTIFICAR ROTEAMENTO
    // ==========================================
    if (!session) {
      console.log(`[Webhook Chatbot] Nenhuma sessão ativa encontrada para ${cleanPhone}. Analisando disparos recentes...`);

      // Checar se há disparos recentes de campanhas para este cliente (ex: últimas 24 horas)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentDelivery, error: deliveryErr } = await supabaseAdmin
        .from('campaign_deliveries')
        .select('*')
        .eq('user_id', userId)
        .eq('customer_phone', cleanPhone)
        .gt('sent_at', twentyFourHoursAgo)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (deliveryErr) {
        console.error('[Webhook Chatbot] Erro ao buscar entregas recentes:', deliveryErr.message);
      }

      if (recentDelivery) {
        // Cliente respondeu a um disparo recente! Iniciar fluxo daquela campanha específica.
        console.log(`[Webhook Chatbot] Resposta de campanha identificada! Campanha ID: ${recentDelivery.campaign_id}`);

        // Obter o passo inicial da campanha
        const { data: initialStep, error: initStepErr } = await supabaseAdmin
          .from('bot_steps')
          .select('*')
          .eq('user_id', userId)
          .eq('campaign_id', recentDelivery.campaign_id)
          .eq('is_initial', true)
          .maybeSingle();

        if (initStepErr || !initialStep) {
          console.warn(`[Webhook Chatbot] Passo inicial não cadastrado para campanha ${recentDelivery.campaign_id}. Usando bot geral.`);
          // Criar sessão e ir para o bot geral
          const { data: newSession } = await supabaseAdmin
            .from('customer_chat_status')
            .insert({
              user_id: userId,
              customer_phone: cleanPhone,
              status: 'GERAL',
              current_step_key: 'start',
              last_interaction_at: new Date().toISOString(),
            })
            .select()
            .single();

          return await startGeneralFlow(userId, cleanPhone, newSession?.id);
        }

        // Criar a sessão no banco em modo CAMPANHA_PENDENTE
        await supabaseAdmin.from('customer_chat_status').insert({
          user_id: userId,
          customer_phone: cleanPhone,
          campaign_id: recentDelivery.campaign_id,
          current_step_key: initialStep.step_key,
          status: 'CAMPANHA_PENDENTE',
          last_interaction_at: new Date().toISOString(),
        });

        // Enviar mensagem inicial da campanha
        await sendResponse(initialStep.message_text);
        return NextResponse.json({ success: true, route: 'CAMPANHA_INICIADA', campaign_id: recentDelivery.campaign_id });
      } else {
        // Nova conversa espontânea. Iniciar fluxo do bot geral.
        console.log(`[Webhook Chatbot] Nenhuma campanha recente. Iniciando fluxo geral FAQ.`);
        
        const { data: newSession } = await supabaseAdmin
          .from('customer_chat_status')
          .insert({
            user_id: userId,
            customer_phone: cleanPhone,
            status: 'GERAL',
            current_step_key: 'start',
            last_interaction_at: new Date().toISOString(),
          })
          .select()
          .single();

        return await startGeneralFlow(userId, cleanPhone, newSession?.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Webhook Chatbot] Erro interno:', err.message);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

// ==========================================
// FUNÇÕES AUXILIARES DE SUPORTE
// ==========================================

async function startGeneralFlow(userId: string, cleanPhone: string, sessionId: string) {
  // Obter o gerenciador global do WhatsApp
  const waService = (global as any).whatsappManager.getService(userId);

  // Buscar passo inicial do bot geral
  const { data: generalStartStep } = await supabaseAdmin
    .from('bot_steps')
    .select('*')
    .eq('user_id', userId)
    .is('campaign_id', null)
    .eq('is_initial', true)
    .maybeSingle();

  const welcomeMessage = generalStartStep?.message_text || 
    'Olá! Como posso te ajudar hoje?\n\nDigite uma opção:\n1. Conhecer serviços\n2. Falar com suporte\n3. Falar com atendente';

  await waService.sendMessage(cleanPhone, welcomeMessage);

  if (sessionId) {
    await supabaseAdmin
      .from('customer_chat_status')
      .update({
        status: 'GERAL',
        campaign_id: null,
        current_step_key: generalStartStep?.step_key || 'start',
        last_interaction_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  }

  return NextResponse.json({ success: true, route: 'GERAL_INICIADO' });
}

async function handleGeneralBotFlow(
  userId: string,
  cleanPhone: string,
  sessionId: string,
  userMessage: string,
  currentStepKey: string | null
) {
  const waService = (global as any).whatsappManager.getService(userId);
  const input = userMessage.toLowerCase().trim();

  // 1. Verificar palavras-chave FAQ globais (ex: 'preco', 'suporte', 'humano', 'endereco')
  // Isso permite saltar diretamente para respostas rápidas
  const { data: allGeneralSteps } = await supabaseAdmin
    .from('bot_steps')
    .select('*')
    .eq('user_id', userId)
    .is('campaign_id', null);

  if (allGeneralSteps) {
    // Tentar achar um passo cuja chave seja igual ou que esteja associada nas palavras chaves das opções
    let matchedStep = allGeneralSteps.find((step) => {
      const stepKey = step.step_key.toLowerCase();
      // Ignorar chaves genéricas como 'start' ou 'default' para match global
      if (['start', 'default', 'fallback'].includes(stepKey)) return false;
      return input.includes(stepKey) || stepKey.includes(input);
    });

    if (matchedStep) {
      console.log(`[Webhook Chatbot] Match de palavra-chave FAQ global encontrada: "${matchedStep.step_key}"`);

      // Se for transição para atendimento humano
      if (matchedStep.step_key.toLowerCase().includes('humano') || matchedStep.step_key === 'suporte') {
        await supabaseAdmin
          .from('customer_chat_status')
          .update({
            status: 'HUMANO',
            last_interaction_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        await waService.sendMessage(cleanPhone, matchedStep.message_text);
        return NextResponse.json({ success: true, mode: 'TRANSICAO_HUMANO' });
      }

      await waService.sendMessage(cleanPhone, matchedStep.message_text);

      const hasOptions = matchedStep.options && matchedStep.options.length > 0;
      await supabaseAdmin
        .from('customer_chat_status')
        .update({
          current_step_key: hasOptions ? matchedStep.step_key : 'start',
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      return NextResponse.json({ success: true, matched_faq_step: matchedStep.step_key });
    }
  }

  // 2. Roteamento por menu/opções baseado no passo atual
  const currentStep = allGeneralSteps?.find(s => s.step_key === (currentStepKey || 'start'));

  if (currentStep) {
    const options = currentStep.options || [];
    let matchedOption = options.find((opt: any) => {
      const trigger = String(opt.trigger).trim().toLowerCase();
      return trigger === input || input.includes(trigger);
    });

    // Fallback/Default
    if (!matchedOption) {
      matchedOption = options.find((opt: any) => opt.trigger === '*' || opt.trigger === 'default' || opt.trigger === 'fallback');
    }

    if (matchedOption) {
      const nextStepKey = matchedOption.next_step;
      const nextStep = allGeneralSteps?.find(s => s.step_key === nextStepKey);

      if (nextStep) {
        if (nextStep.step_key.toLowerCase().includes('humano') || nextStepKey === 'humano') {
          await supabaseAdmin
            .from('customer_chat_status')
            .update({
              status: 'HUMANO',
              last_interaction_at: new Date().toISOString(),
            })
            .eq('id', sessionId);

          await waService.sendMessage(cleanPhone, nextStep.message_text);
          return NextResponse.json({ success: true, mode: 'TRANSICAO_HUMANO' });
        }

        await waService.sendMessage(cleanPhone, nextStep.message_text);

        const hasOptions = nextStep.options && nextStep.options.length > 0;
        await supabaseAdmin
          .from('customer_chat_status')
          .update({
            current_step_key: hasOptions ? nextStepKey : 'start',
            last_interaction_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        return NextResponse.json({ success: true, next_step: nextStepKey });
      }
    }
  }

  // 3. Fallback absoluto se nada bater (reiniciar ou responder menu inicial)
  const defaultStep = allGeneralSteps?.find(s => s.is_initial) || currentStep;
  const fallbackMsg = `Desculpe, não entendi.\n\n${defaultStep?.message_text || 'Como posso te ajudar?'}`;
  await waService.sendMessage(cleanPhone, fallbackMsg);
  
  await supabaseAdmin
    .from('customer_chat_status')
    .update({
      current_step_key: defaultStep?.step_key || 'start',
      last_interaction_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  return NextResponse.json({ success: true, route: 'FALLBACK_GENERAL' });
}
