import { StyleSheet } from '@react-pdf/renderer';

export const S = StyleSheet.create({
  page:          { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  header:        { borderBottom: '1pt solid #000', paddingBottom: 8, marginBottom: 14, textAlign: 'center' },
  title:         { fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  subtitle:      { fontSize: 10, marginBottom: 2 },
  date:          { color: '#666', fontSize: 8 },

  sectionTitle:    { fontSize: 10, fontWeight: 'bold', backgroundColor: '#E8EDF2', padding: '4 6', marginTop: 10, marginBottom: 4 },
  subsectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#555', padding: '2 6', marginTop: 6, marginBottom: 3 },
  clasifTitle:     { fontSize: 8, fontWeight: 'bold', color: '#444', backgroundColor: '#F5F7FA', padding: '2 6', marginTop: 4, marginBottom: 2 },
  areaTitle:       { fontSize: 12, fontWeight: 'bold', backgroundColor: '#D0D8E4', padding: '5 8', marginTop: 14, marginBottom: 4 },
  sublabel:        { fontSize: 8, color: '#666', marginTop: -3, marginBottom: 6, padding: '0 8' },
  summaryBox:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryItem:   { flex: 1, border: '1pt solid #ccc', padding: '4 6', borderRadius: 3 },
  summaryLabel:  { fontSize: 7, color: '#666', marginBottom: 1 },
  summaryValue:  { fontSize: 11, fontWeight: 'bold' },

  table:         { border: '1pt solid #ccc', marginBottom: 6 },
  headerRow:     { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: '1pt solid #ccc' },
  row:           { flexDirection: 'row', borderBottom: '0.5pt solid #eee' },
  cell:          { paddingHorizontal: 5, paddingVertical: 3, borderRight: '0.5pt solid #eee' },
  cellText:      { fontSize: 8, lineHeight: 1.3 },
  headerText:    { fontSize: 8, fontWeight: 'bold' },

  colCode:       { width: '14%' },
  colPlan:       { width: '10%' },
  colDesc:       { width: '22%' },
  colChar:       { width: '22%' },
  colBrand:      { width: '18%' },
  colImg:        { width: '14%', borderRight: 0, alignItems: 'center', justifyContent: 'center' },

  colTrasCode:   { width: '15%' },
  colTrasOffice: { width: '35%' },
  colTrasAccion: { width: '20%' },
  colTrasDate:   { width: '30%', borderRight: 0 },

  colBajaSub:    { width: '15%' },
  colBajaCode:   { width: '12%' },
  colBajaDesc:   { width: '28%' },
  colBajaOfi:    { width: '15%' },
  colBajaOrig:   { width: '15%' },
  colBajaMotiv:  { width: '15%', borderRight: 0 },

  noData:        { padding: '6 8', color: '#999', fontSize: 8 },
  signatures:    { marginTop: 40, flexDirection: 'row', justifyContent: 'space-around' },
  signLine:      { borderBottom: '1pt solid #000', width: 140, marginBottom: 4 },
  signText:      { textAlign: 'center', fontSize: 8 },
  officeSubTitle: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#EEF2F7', padding: '3 6', marginTop: 10, marginBottom: 2, borderLeft: '3pt solid #4B7AB1' },
  obsBox:        { marginTop: 20, borderTop: '0.5pt solid #ccc', paddingTop: 8 },
  obsLines:      { marginTop: 6, height: 50, border: '0.5pt solid #ccc' },
});
