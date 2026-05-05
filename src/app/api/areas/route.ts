import { NextResponse, type NextRequest } from 'next/server';
import { createArea, getAreas } from '@/lib/api';

export async function GET() {
  try {
    return NextResponse.json(await getAreas());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron obtener las áreas';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const area = await createArea({ name: String(body?.name ?? '') });
    return NextResponse.json(area, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el área';
    return NextResponse.json({ message }, { status: 400 });
  }
}