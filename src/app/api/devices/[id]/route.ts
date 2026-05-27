import { NextResponse, type NextRequest } from 'next/server';
import { deleteDevice, getDeviceById, updateDevice } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const device = await getDeviceById(id);

    if (!device) {
      return NextResponse.json({ message: 'Dispositivo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(device);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener el dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const device = await updateDevice(id, {
      status: body?.status !== undefined ? String(body.status) as 'New' | 'Transfer' : undefined,
      inventoryCode: body?.inventoryCode !== undefined ? String(body.inventoryCode) : undefined,
      typeId: body?.typeId !== undefined ? String(body.typeId) : undefined,
      destinationOfficeId: body?.destinationOfficeId !== undefined ? String(body.destinationOfficeId) : undefined,
      originOfficeId: body?.originOfficeId !== undefined ? String(body.originOfficeId) : undefined,
      originOfficeDescription: body?.originOfficeDescription !== undefined ? String(body.originOfficeDescription) : undefined,
    });
    return NextResponse.json(device);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return NextResponse.json(await deleteDevice(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar el dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}