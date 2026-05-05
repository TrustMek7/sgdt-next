import { NextResponse } from 'next/server';
import { getAreaReports } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const areaId = url.searchParams.get('areaId') ?? undefined;
    return NextResponse.json(await getAreaReports(areaId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener el reporte por área';
    return NextResponse.json({ message }, { status: 400 });
  }
}