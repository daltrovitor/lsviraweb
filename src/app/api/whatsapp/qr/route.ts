import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'QR Code é emitido via Socket.io após registro da sessão.',
    qr: null,
  });
}

export const runtime = 'nodejs';
