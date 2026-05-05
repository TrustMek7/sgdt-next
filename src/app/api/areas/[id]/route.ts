import { NextResponse, type NextRequest } from 'next/server';
import { getAreas, updateArea, deleteArea } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const area = (await getAreas()).find((item) => item.id === id);

    if (!area) {
      return NextResponse.json({ message: 'Área no encontrada' }, { status: 404 });
    }

    return NextResponse.json(area);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener el área';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const area = await updateArea(id, { name: body?.name !== undefined ? String(body.name) : undefined });
    return NextResponse.json(area);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el área';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return NextResponse.json(await deleteArea(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar el área';
    return NextResponse.json({ message }, { status: 400 });
  }
}