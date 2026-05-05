import { NextResponse, type NextRequest } from 'next/server';
import { createBaja, getBajas } from '@/lib/api';

export async function GET() {
  try {
    return NextResponse.json(await getBajas());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron obtener las bajas';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baja = await createBaja({
      areaId: String(body?.areaId ?? ''),
      codigoInventario: body?.codigoInventario !== undefined ? String(body.codigoInventario) : undefined,
      descripcion: String(body?.descripcion ?? ''),
      oficinaNombre: body?.oficinaNombre !== undefined ? String(body.oficinaNombre) : undefined,
      origen: body?.origen !== undefined ? String(body.origen) : undefined,
      motivo: body?.motivo !== undefined ? String(body.motivo) : undefined,
    });
    return NextResponse.json(baja, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la baja';
    return NextResponse.json({ message }, { status: 400 });
  }
}