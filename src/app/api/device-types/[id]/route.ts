import { NextResponse, type NextRequest } from 'next/server';
import { deleteDeviceType, getDeviceTypes, updateDeviceType } from '@/lib/api';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const deviceType = (await getDeviceTypes()).find((item) => item.id === id);

    if (!deviceType) {
      return NextResponse.json({ message: 'Tipo de dispositivo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(deviceType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener el tipo de dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deviceType = await updateDeviceType(id, {
      planCode: body?.planCode !== undefined ? String(body.planCode) : undefined,
      description: body?.description !== undefined ? String(body.description) : undefined,
      characteristics: body?.characteristics !== undefined ? String(body.characteristics) : undefined,
      brandModel: body?.brandModel !== undefined ? String(body.brandModel) : undefined,
      imageUrl: body?.imageUrl !== undefined ? String(body.imageUrl) : undefined,
      isTransfer: body?.isTransfer !== undefined ? Boolean(body.isTransfer) : undefined,
    });
    return NextResponse.json(deviceType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el tipo de dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return NextResponse.json(await deleteDeviceType(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar el tipo de dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}