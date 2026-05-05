import { NextResponse, type NextRequest } from 'next/server';
import { createOffice, getOffices } from '@/lib/api';

export async function GET() {
  try {
    return NextResponse.json(await getOffices());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron obtener las oficinas';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const office = await createOffice({
      name: String(body?.name ?? ''),
      floor: Number(body?.floor ?? 1),
      areaId: String(body?.areaId ?? ''),
    });
    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la oficina';
    return NextResponse.json({ message }, { status: 400 });
  }
}