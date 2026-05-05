import { NextResponse, type NextRequest } from 'next/server';
import { deleteOffice, getOffices, updateOffice } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const office = (await getOffices()).find((item) => item.id === id);

    if (!office) {
      return NextResponse.json({ message: 'Oficina no encontrada' }, { status: 404 });
    }

    return NextResponse.json(office);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener la oficina';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const office = await updateOffice(id, {
      name: body?.name !== undefined ? String(body.name) : undefined,
      floor: body?.floor !== undefined ? Number(body.floor) : undefined,
      areaId: body?.areaId !== undefined ? String(body.areaId) : undefined,
    });
    return NextResponse.json(office);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar la oficina';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return NextResponse.json(await deleteOffice(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar la oficina';
    return NextResponse.json({ message }, { status: 400 });
  }
}