import { NextResponse, type NextRequest } from 'next/server';
import { getReportBatch, getReportSummary } from '@/lib/api';
import { ReportBatchFilter } from '@/lib/types';

export async function GET() {
  try {
    return NextResponse.json(await getReportSummary());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron obtener los reportes';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters = Array.isArray(body?.reports) ? (body.reports as ReportBatchFilter[]) : [body as ReportBatchFilter];
    return NextResponse.json(await getReportBatch(filters));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el reporte';
    return NextResponse.json({ message }, { status: 400 });
  }
}