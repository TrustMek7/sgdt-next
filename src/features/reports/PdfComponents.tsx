'use client';

import React from 'react';
import { Document, Page, Text, View, Image as PDFImage, type ViewProps } from '@react-pdf/renderer';
import type { Device, DeviceType, Clasificacion, TrasladoRegistro, ReportBatchItem, ReportGroupBy } from '../../lib/types';
import { S } from './pdfStyles';
import { buildReportSections, groupByClasif, isElectronicsClasif, aggregateByType } from './buildSections';

// ─── Shared primitives ────────────────────────────────────────────────────────

function TableHeader({ cols }: { cols: { label: string; style?: ViewProps['style'] }[] }) {
  return (
    <View style={S.headerRow} minPresenceAhead={60}>
      {cols.map((c, i) => (
        <View
          key={i}
          style={c.style ? ({ ...(S.cell as object), ...(c.style as object) } as ViewProps['style']) : (S.cell as ViewProps['style'])}
        >
          <Text style={S.headerText}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

function DeviceImageCell({ url, baseUrl }: { url?: string; baseUrl: string }) {
  if (!url) return <View style={[S.cell, S.colImg]}><Text style={S.cellText}>-</Text></View>;
  const src = url.startsWith('http') ? url : `${baseUrl}${url}`;
  return (
    <View style={[S.cell, S.colImg]}>
      <PDFImage src={src} style={{ width: 32, height: 32, objectFit: 'contain' }} />
    </View>
  );
}

// ─── Section devices (PDF) — groups by classification ─────────────────────────

export function SectionDevicesPDF({ newDevices, transferDevices, transferRedistribuido, salidas: _salidas, entradas: _entradas, baseUrl, clasificaciones }: {
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  transferRedistribuido: { device: Device; type: DeviceType }[];
  salidas: TrasladoRegistro[];
  entradas: TrasladoRegistro[];
  baseUrl: string;
  clasificaciones: Clasificacion[];
}) {
  const newGroups           = groupByClasif(newDevices, clasificaciones);
  const transferGroups      = groupByClasif(transferDevices, clasificaciones);
  const redistribuidoGroups = groupByClasif(transferRedistribuido, clasificaciones);

  return (
    <>
      {/* ── Nuevos ─────────────────────────────────────────────────────────── */}
      <Text style={S.sectionTitle}>DISPOSITIVOS NUEVOS ({newDevices.length})</Text>
      {newDevices.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
        newGroups.map(({ name, items }, gi) => (
          <View key={gi}>
            {newGroups.length > 1 && <Text style={S.clasifTitle}>{name.toUpperCase()} ({items.length})</Text>}
            {!isElectronicsClasif(name) ? (
              <View style={S.table}>
                <TableHeader cols={[
                  { label: 'CÓDIGO', style: { width: '20%' } },
                  { label: 'DESCRIPCIÓN', style: { width: '60%' } },
                  { label: 'CANTIDAD', style: { width: '20%', borderRight: 0 } },
                ]} />
                {aggregateByType(items).map(({ type, count }, i) => (
                  <View key={i} style={S.row} wrap={false}>
                    <View style={[S.cell, { width: '20%' }]}><Text style={S.cellText}>{type.planCode}</Text></View>
                    <View style={[S.cell, { width: '60%' }]}><Text style={S.cellText}>{type.description}</Text></View>
                    <View style={[S.cell, { width: '20%', borderRight: 0 }]}><Text style={S.cellText}>{count}</Text></View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={S.table}>
                <TableHeader cols={[
                  { label: 'INVENTARIO', style: S.colCode }, { label: 'PLAN', style: S.colPlan },
                  { label: 'DESCRIPCIÓN', style: S.colDesc }, { label: 'CARACTERÍSTICAS', style: S.colChar },
                  { label: 'MARCA / MODELO', style: S.colBrand }, { label: 'IMAGEN', style: S.colImg },
                ]} />
                {items.map(({ device, type }, i) => (
                  <View key={i} style={S.row} wrap={false}>
                    <View style={[S.cell, S.colCode]}><Text style={S.cellText}>{device.inventoryCode || 'S/C'}</Text></View>
                    <View style={[S.cell, S.colPlan]}><Text style={S.cellText}>{type.planCode}</Text></View>
                    <View style={[S.cell, S.colDesc]}><Text style={S.cellText}>{type.description}</Text></View>
                    <View style={[S.cell, S.colChar]}><Text style={S.cellText}>{type.characteristics || '-'}</Text></View>
                    <View style={[S.cell, S.colBrand]}><Text style={S.cellText}>{type.brandModel || '-'}</Text></View>
                    <DeviceImageCell url={type.imageUrl} baseUrl={baseUrl} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}

      {/* ── Traslados ──────────────────────────────────────────────────────── */}
      <Text style={S.sectionTitle}>DISPOSITIVOS DE TRASLADO ({transferDevices.length})</Text>
      {transferDevices.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
        transferGroups.map(({ name, items }, gi) => (
          <View key={gi}>
            {transferGroups.length > 1 && <Text style={S.clasifTitle}>{name.toUpperCase()} ({items.length})</Text>}
            {!isElectronicsClasif(name) ? (
              <View style={S.table}>
                <TableHeader cols={[
                  { label: 'CÓDIGO', style: { width: '20%' } },
                  { label: 'DESCRIPCIÓN', style: { width: '60%' } },
                  { label: 'CANTIDAD', style: { width: '20%', borderRight: 0 } },
                ]} />
                {aggregateByType(items).map(({ type, count }, i) => (
                  <View key={i} style={S.row} wrap={false}>
                    <View style={[S.cell, { width: '20%' }]}><Text style={S.cellText}>{type.planCode}</Text></View>
                    <View style={[S.cell, { width: '60%' }]}><Text style={S.cellText}>{type.description}</Text></View>
                    <View style={[S.cell, { width: '20%', borderRight: 0 }]}><Text style={S.cellText}>{count}</Text></View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={S.table}>
                <TableHeader cols={[
                  { label: 'INVENTARIO', style: S.colCode }, { label: 'PLAN', style: S.colPlan },
                  { label: 'DESCRIPCIÓN', style: { width: '38%' } }, { label: 'ORIGEN', style: { width: '38%' } },
                ]} />
                {items.map(({ device, type }, i) => (
                  <View key={i} style={S.row} wrap={false}>
                    <View style={[S.cell, S.colCode]}><Text style={S.cellText}>{device.inventoryCode || 'S/C'}</Text></View>
                    <View style={[S.cell, S.colPlan]}><Text style={S.cellText}>{type.planCode}</Text></View>
                    <View style={[S.cell, { width: '38%' }]}><Text style={S.cellText}>{type.description}</Text></View>
                    <View style={[S.cell, { width: '38%' }]}><Text style={S.cellText}>{device.originOfficeDescription || '-'}</Text></View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}

      {/* ── Traslados redistribuidos ───────────────────────────────────────── */}
      <Text style={S.sectionTitle}>TRASLADOS — REDISTRIBUIDOS ({transferRedistribuido.length})</Text>
      {transferRedistribuido.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
        redistribuidoGroups.map(({ name, items }, gi) => (
          <View key={gi}>
            {redistribuidoGroups.length > 1 && <Text style={S.clasifTitle}>{name.toUpperCase()} ({items.length})</Text>}
            {!isElectronicsClasif(name) ? (
              <View style={S.table}>
                <TableHeader cols={[
                  { label: 'CÓDIGO', style: { width: '20%' } },
                  { label: 'DESCRIPCIÓN', style: { width: '50%' } },
                  { label: 'DESTINO', style: { width: '30%', borderRight: 0 } },
                ]} />
                {items.map(({ device, type }, i) => (
                  <View key={i} style={S.row} wrap={false}>
                    <View style={[S.cell, { width: '20%' }]}><Text style={S.cellText}>{type.planCode}</Text></View>
                    <View style={[S.cell, { width: '50%' }]}><Text style={S.cellText}>{type.description}</Text></View>
                    <View style={[S.cell, { width: '30%', borderRight: 0 }]}><Text style={S.cellText}>{device.destinoRedistribucion || '-'}</Text></View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={S.table}>
                <TableHeader cols={[
                  { label: 'INVENTARIO', style: S.colCode }, { label: 'PLAN', style: S.colPlan },
                  { label: 'DESCRIPCIÓN', style: { width: '30%' } }, { label: 'ORIGEN', style: { width: '28%' } },
                  { label: 'DESTINO', style: { width: '18%', borderRight: 0 } },
                ]} />
                {items.map(({ device, type }, i) => (
                  <View key={i} style={S.row} wrap={false}>
                    <View style={[S.cell, S.colCode]}><Text style={S.cellText}>{device.inventoryCode || 'S/C'}</Text></View>
                    <View style={[S.cell, S.colPlan]}><Text style={S.cellText}>{type.planCode}</Text></View>
                    <View style={[S.cell, { width: '30%' }]}><Text style={S.cellText}>{type.description}</Text></View>
                    <View style={[S.cell, { width: '28%' }]}><Text style={S.cellText}>{device.originOfficeDescription || '-'}</Text></View>
                    <View style={[S.cell, { width: '18%', borderRight: 0 }]}><Text style={S.cellText}>{device.destinoRedistribucion || '-'}</Text></View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}

      {/* ── Historial — TODO: definir filtro de rango de fechas antes de mostrar
      {(salidas.length > 0 || entradas.length > 0) && (
        <View>
          <Text style={S.sectionTitle}>HISTORIAL DE TRASLADOS</Text>
          <Text style={S.subsectionTitle}>Salidas ({salidas.length})</Text>
          {salidas.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
            <View style={S.table}>
              <TableHeader cols={[
                { label: 'CÓDIGO', style: S.colTrasCode }, { label: 'DESTINO', style: S.colTrasOffice },
                { label: 'ACCIÓN', style: S.colTrasAccion }, { label: 'FECHA', style: S.colTrasDate },
              ]} />
              {salidas.map((t, i) => (
                <View key={i} style={S.row} wrap={false}>
                  <View style={[S.cell, S.colTrasCode]}><Text style={S.cellText}>{t.codigoInventario || 'S/C'}</Text></View>
                  <View style={[S.cell, S.colTrasOffice]}><Text style={S.cellText}>{t.destinoOficinaNombre || '-'}</Text></View>
                  <View style={[S.cell, S.colTrasAccion]}><Text style={S.cellText}>{t.accion}</Text></View>
                  <View style={[S.cell, S.colTrasDate]}><Text style={S.cellText}>{new Date(t.createdAt).toLocaleString('es-ES')}</Text></View>
                </View>
              ))}
            </View>
          )}
          <Text style={S.subsectionTitle}>Entradas ({entradas.length})</Text>
          {entradas.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
            <View style={S.table}>
              <TableHeader cols={[
                { label: 'CÓDIGO', style: S.colTrasCode }, { label: 'ORIGEN', style: S.colTrasOffice },
                { label: 'ACCIÓN', style: S.colTrasAccion }, { label: 'FECHA', style: S.colTrasDate },
              ]} />
              {entradas.map((t, i) => (
                <View key={i} style={S.row} wrap={false}>
                  <View style={[S.cell, S.colTrasCode]}><Text style={S.cellText}>{t.codigoInventario || 'S/C'}</Text></View>
                  <View style={[S.cell, S.colTrasOffice]}><Text style={S.cellText}>{t.origenOficinaNombre || '-'}</Text></View>
                  <View style={[S.cell, S.colTrasAccion]}><Text style={S.cellText}>{t.accion}</Text></View>
                  <View style={[S.cell, S.colTrasDate]}><Text style={S.cellText}>{new Date(t.createdAt).toLocaleString('es-ES')}</Text></View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      */}
    </>
  );
}

// ─── Full PDF document ────────────────────────────────────────────────────────

export function ReportPDF({ reports, baseUrl, groupBy }: {
  reports: ReportBatchItem[];
  baseUrl: string;
  groupBy: ReportGroupBy;
}) {
  return (
    <Document>
      {reports.map((report, ri) => {
        const sections = buildReportSections(report, groupBy);
        return (
          <Page key={ri} size="A4" style={S.page} orientation="landscape">
            <View style={S.header}>
              <Text style={S.title}>Reporte de Traslado de Dispositivos</Text>
              <Text style={S.subtitle}>{report.title}</Text>
              <Text style={S.date}>Generado el {new Date().toLocaleDateString('es-ES')}</Text>
            </View>

            <View style={S.summaryBox}>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Dispositivos nuevos</Text><Text style={S.summaryValue}>{report.totals.newDevices}</Text></View>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Traslados</Text><Text style={S.summaryValue}>{report.totals.transferDevices}</Text></View>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Bajas</Text><Text style={S.summaryValue}>{report.bajas.length}</Text></View>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Total dispositivos</Text><Text style={S.summaryValue}>{report.totals.devices}</Text></View>
            </View>

            {sections.map((section, si) => (
              <View key={si}>
                <Text style={S.areaTitle}>{section.label}</Text>
                {section.sublabel && <Text style={S.sublabel}>{section.sublabel}</Text>}

                {section.subSections ? (
                  <>
                    {section.subSections.map((sub, ssi) => (
                      <View key={ssi}>
                        <Text style={S.officeSubTitle}>{sub.label}</Text>
                        <SectionDevicesPDF
                          newDevices={sub.newDevices} transferDevices={sub.transferDevices}
                          transferRedistribuido={sub.transferRedistribuido}
                          salidas={sub.salidas} entradas={sub.entradas}
                          baseUrl={baseUrl} clasificaciones={report.clasificaciones}
                        />
                      </View>
                    ))}
                  </>
                ) : (
                  <SectionDevicesPDF
                    newDevices={section.newDevices} transferDevices={section.transferDevices}
                    transferRedistribuido={section.transferRedistribuido}
                    salidas={section.salidas} entradas={section.entradas}
                    baseUrl={baseUrl} clasificaciones={report.clasificaciones}
                  />
                )}

                <Text style={S.sectionTitle}>BAJAS ({section.bajas.length})</Text>
                {section.bajas.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
                  <View style={S.table}>
                    <TableHeader cols={[
                      { label: 'SUBGERENCIA', style: S.colBajaSub  },
                      { label: 'INVENTARIO',  style: S.colBajaCode },
                      { label: 'DESCRIPCIÓN', style: S.colBajaDesc },
                      { label: 'OFICINA',     style: S.colBajaOfi  },
                      { label: 'ORIGEN',      style: S.colBajaOrig },
                      { label: 'MOTIVO',      style: S.colBajaMotiv },
                    ]} />
                    {section.bajas.map((baja, i) => (
                      <View key={i} style={S.row} wrap={false}>
                        <View style={[S.cell, S.colBajaSub]}><Text style={S.cellText}>{baja.areaName || section.label}</Text></View>
                        <View style={[S.cell, S.colBajaCode]}><Text style={S.cellText}>{baja.inventoryCode || 'S/C'}</Text></View>
                        <View style={[S.cell, S.colBajaDesc]}><Text style={S.cellText}>{baja.description}</Text></View>
                        <View style={[S.cell, S.colBajaOfi]}><Text style={S.cellText}>{baja.officeName || '-'}</Text></View>
                        <View style={[S.cell, S.colBajaOrig]}><Text style={S.cellText}>{baja.origin || '-'}</Text></View>
                        <View style={[S.cell, S.colBajaMotiv]}><Text style={S.cellText}>{baja.reason || '-'}</Text></View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <View style={S.obsBox} wrap={false}>
              <Text>Observaciones:</Text>
              <View style={S.obsLines} />
            </View>
            <View style={S.signatures} wrap={false}>
              <View><View style={S.signLine} /><Text style={S.signText}>Entregado por</Text></View>
              <View><View style={S.signLine} /><Text style={S.signText}>Recibido por</Text></View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
