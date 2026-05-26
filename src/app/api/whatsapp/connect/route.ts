import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp é gerenciado via Socket.io. Conecte pelo Command Center.',
    started: false,
  });
}

export const runtime = 'nodejs';
