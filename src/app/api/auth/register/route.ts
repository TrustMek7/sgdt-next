import { NextResponse, type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? '');
    const password = String(body?.password ?? '');
    const name = String(body?.name ?? '');

    if (!email || !password) {
      return NextResponse.json({ message: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const result = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || undefined,
        },
      },
    });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo registrar el usuario';
    return NextResponse.json({ message }, { status: 400 });
  }
}