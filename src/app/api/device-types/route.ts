import { NextResponse, type NextRequest } from 'next/server';
import { createDeviceType, getDeviceTypes } from '@/lib/api';

export async function GET() {
  try {
    return NextResponse.json(await getDeviceTypes());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron obtener los tipos de dispositivos';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deviceType = await createDeviceType({
      planCode: String(body?.planCode ?? body?.id ?? ''),
      description: String(body?.description ?? ''),
      characteristics: body?.characteristics !== undefined ? String(body.characteristics) : undefined,
      brandModel: body?.brandModel !== undefined ? String(body.brandModel) : undefined,
      imageUrl: body?.imageUrl !== undefined ? String(body.imageUrl) : undefined,
      isTransfer: body?.isTransfer !== undefined ? Boolean(body.isTransfer) : undefined,
    });
    return NextResponse.json(deviceType, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el tipo de dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}