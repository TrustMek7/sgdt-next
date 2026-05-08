import { NextResponse, type NextRequest } from 'next/server';
import { getOfficeTrasladoRegistro } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return NextResponse.json(await getOfficeTrasladoRegistro(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener el registro de traslados';
    return NextResponse.json({ message }, { status: 400 });
  }
}
