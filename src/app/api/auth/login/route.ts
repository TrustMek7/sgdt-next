import { NextResponse, type NextRequest } from 'next/server';
import { login } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '');
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return NextResponse.json({ message: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const data = await login(email, password);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión';
    return NextResponse.json({ message }, { status: 400 });
  }
}