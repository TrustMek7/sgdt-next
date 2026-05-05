import { NextResponse, type NextRequest } from 'next/server';
import { deleteBaja, getBajas, updateBaja } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const baja = (await getBajas()).find((item) => item.id === id);

    if (!baja) {
      return NextResponse.json({ message: 'Baja no encontrada' }, { status: 404 });
    }

    return NextResponse.json(baja);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener la baja';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const baja = await updateBaja(id, {
      areaId: body?.areaId !== undefined ? String(body.areaId) : undefined,
      codigoInventario: body?.codigoInventario !== undefined ? String(body.codigoInventario) : undefined,
      descripcion: body?.descripcion !== undefined ? String(body.descripcion) : undefined,
      oficinaNombre: body?.oficinaNombre !== undefined ? String(body.oficinaNombre) : undefined,
      origen: body?.origen !== undefined ? String(body.origen) : undefined,
      motivo: body?.motivo !== undefined ? String(body.motivo) : undefined,
    });
    return NextResponse.json(baja);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar la baja';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return NextResponse.json(await deleteBaja(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar la baja';
    return NextResponse.json({ message }, { status: 400 });
  }
}