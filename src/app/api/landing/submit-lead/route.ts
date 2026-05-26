import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, email, whatsapp } = body;

    if (!name || !email || !whatsapp) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Insert lead into landing_leads table
    const { data, error } = await supabase
      .from('landing_leads')
      .insert({
        full_name: name,
        email: email,
        whatsapp: whatsapp,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting lead:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar cadastro' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, lead: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in submit-lead API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
