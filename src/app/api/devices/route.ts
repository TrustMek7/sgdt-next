import { NextResponse, type NextRequest } from 'next/server';
import { createDevice, getDevicesPage } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const result = await getDevicesPage(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron obtener los dispositivos';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await createDevice({
      status: String(body?.status ?? '') as import('@/lib/types').Status,
      inventoryCode: body?.inventoryCode !== undefined ? String(body.inventoryCode) : undefined,
      inventoryCodes: Array.isArray(body?.inventoryCodes) ? body.inventoryCodes.map((value: unknown) => String(value)) : undefined,
      typeId: String(body?.typeId ?? ''),
      destinationOfficeId: String(body?.destinationOfficeId ?? ''),
      originOfficeId: body?.originOfficeId !== undefined ? String(body.originOfficeId) : undefined,
      originOfficeDescription: body?.originOfficeDescription !== undefined ? String(body.originOfficeDescription) : undefined,
      quantity: body?.quantity !== undefined ? Number(body.quantity) : undefined,
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el dispositivo';
    return NextResponse.json({ message }, { status: 400 });
  }
}