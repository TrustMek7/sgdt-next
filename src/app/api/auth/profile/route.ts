import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/api';

export async function POST() {
  try {
    const data = await getProfile();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener el perfil';
    return NextResponse.json({ message }, { status: 400 });
  }
}