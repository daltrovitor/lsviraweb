import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseCSVBuffer } from '@/lib/csv';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Sessão inválida' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const contacts = parseCSVBuffer(buffer);

    if (contacts.length === 0) {
      return NextResponse.json({ success: false, error: 'CSV sem contatos válidos' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contacts,
      message: `${contacts.length} contatos importados`,
    });
  } catch (err) {
    console.error('CSV upload error:', err);
    return NextResponse.json({ success: false, error: 'Erro ao processar CSV' }, { status: 500 });
  }
}
