import { NextResponse } from 'next/server';
import { getReportSummary } from '@/lib/api';

export async function GET() {
  try {
    return NextResponse.json(await getReportSummary());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo obtener el resumen';
    return NextResponse.json({ message }, { status: 400 });
  }
}