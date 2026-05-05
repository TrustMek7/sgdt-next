import { NextResponse, type NextRequest } from 'next/server';
import { getReportBatch } from '@/lib/api';
import { ReportBatchFilter } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reports = Array.isArray(body?.reports) ? (body.reports as ReportBatchFilter[]) : [body as ReportBatchFilter];
    return NextResponse.json(await getReportBatch(reports));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el batch de reportes';
    return NextResponse.json({ message }, { status: 400 });
  }
}