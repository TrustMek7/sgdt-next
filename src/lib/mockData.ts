import { Area, Office, DeviceType, Device } from './types';

// ÁREAS
export const mockAreas: Area[] = [
  { id: 'a1', name: 'Administración', officeCount: 3 },
  { id: 'a2', name: 'Fiscalización', officeCount: 2 },
  { id: 'a3', name: 'Recursos Humanos', officeCount: 2 },
  { id: 'a4', name: 'Finanzas', officeCount: 2 },
  { id: 'a5', name: 'Servicios Públicos', officeCount: 2 },
  { id: 'a6', name: 'Planejamiento', officeCount: 2 }
];

// OFICINAS
export const mockOffices: Office[] = [
  // Administración
  { id: 'o1', name: 'Dirección General', floor: 1, areaId: 'a1', deviceCount: 5 },
  { id: 'o2', name: 'Subdirección', floor: 1, areaId: 'a1', deviceCount: 3 },
  { id: 'o3', name: 'Secretaría General', floor: 1, areaId: 'a1', deviceCount: 4 },
  // Fiscalización
  { id: 'o4', name: 'Oficina de Fiscalización', floor: 2, areaId: 'a2', deviceCount: 8 },
  { id: 'o5', name: 'Auditoría Interna', floor: 2, areaId: 'a2', deviceCount: 4 },
  // Recursos Humanos
  { id: 'o6', name: 'RRHH - Gestión', floor: 2, areaId: 'a3', deviceCount: 6 },
  { id: 'o7', name: 'RRHH - Nómina', floor: 2, areaId: 'a3', deviceCount: 3 },
  // Finanzas
  { id: 'o8', name: 'Contabilidad', floor: 3, areaId: 'a4', deviceCount: 7 },
  { id: 'o9', name: 'Tesorería', floor: 3, areaId: 'a4', deviceCount: 5 },
  // Servicios Públicos
  { id: 'o10', name: 'Servicios Técnicos', floor: 3, areaId: 'a5', deviceCount: 6 },
  { id: 'o11', name: 'Mantenimiento', floor: 3, areaId: 'a5', deviceCount: 4 },
  // Planejamiento
  { id: 'o12', name: 'Planejamiento Estratégico', floor: 4, areaId: 'a6', deviceCount: 5 },
  { id: 'o13', name: 'Estadística', floor: 4, areaId: 'a6', deviceCount: 4 }
];

// TIPOS DE DISPOSITIVOS - LEYENDA (Ordenado: E# primero, luego Ex#)
export const mockDeviceTypes: DeviceType[] = [
  // Equipos Nuevos (E#)
  {
    id: 't1',
    planCode: 'E1',
    description: 'COMPUTADORA - 1A',
    characteristics: '- Computadora Core I7/RYZEN 7, 16GB RAM, 1TB SSD, 4GB VIDEO\n- Licencia de Antivirus\n- Monitor LED de 32" HDMI',
    brandModel: 'Core I7/RYZEN 7'
  },
  {
    id: 't2',
    planCode: "E1'",
    description: 'COMPUTADORA - 1A/INCL.PROGRAMAS',
    characteristics: '- Computadora Core I7/RYZEN 7, 16GB RAM, 1TB SSD, 4GB VIDEO\n- Licencia de AUTOCAD BÁSICO V.2024\n- Licencia de Antivirus\n- Licencia de POWERCOST\n- Monitor LED de 32" HDMI',
    brandModel: 'Core I7/RYZEN 7'
  },
  {
    id: 't3',
    planCode: 'E2',
    description: 'COMPUTADORA 1',
    characteristics: '- Computadora Core I7/RYZEN 7, 16GB RAM, 1TB SSD, 4GB VIDEO\n- Licencia de Antivirus\n- Monitor LED de 23.5" HDMI',
    brandModel: 'Core I7/RYZEN 7'
  },
  {
    id: 't4',
    planCode: 'E3',
    description: 'COMPUTADORA 2',
    characteristics: '- Computadora Core I7/RYZEN 7, 16GB RAM, 1TB SSD, INCL. ACCES\n- Licencia de Antivirus\n- Monitor LED de 23.5" HDMI',
    brandModel: 'Core I7/RYZEN 7'
  },
  {
    id: 't5',
    planCode: 'E4',
    description: 'COMPUTADORA 3',
    characteristics: '- Computadora Core I7/RYZEN 7, 16GB RAM, 1TB SSD, INCL. ACCES\n- Licencia de Antivirus\n- Monitor LED de 21.5" HDMI',
    brandModel: 'Core I7/RYZEN 7'
  },
  {
    id: 't6',
    planCode: 'E5',
    description: 'IMPRESORA MULTIFUNCIONAL TIPO A',
    characteristics: '- Impresora Multifuncional Laser A4 Monocromático/Color\n- KYOCERA ECOSYS MA 4500x',
    brandModel: 'KYOCERA ECOSYS MA 4500x'
  },
  {
    id: 't7',
    planCode: 'E6',
    description: 'IMPRESORA MULTIFUNCIONAL TIPO B',
    characteristics: '- Impresora Multifuncional Tamaño A4 a Color C/Sistema Co\n- BROTHER MFC-T9300W',
    brandModel: 'BROTHER MFC-T9300W'
  },
  {
    id: 't8',
    planCode: 'E7',
    description: 'PLOTTER A0',
    characteristics: '- Plotter para Formatos A0 c/Inyección de Tinta 2400x1200 PPP\n- PLOTTER CANON TM-350',
    brandModel: 'PLOTTER CANON TM-350'
  },
  {
    id: 't9',
    planCode: 'E8',
    description: 'PLOTTER SISTEMA COPIADO',
    characteristics: '- Plotter Tinta c/Sistema de Copiado IMP.2400x1200 PPP, B/N Y',
    brandModel: ''
  },
  {
    id: 't10',
    planCode: 'E9',
    description: 'FOTOCOPIADORA MULTIFUNCIONAL',
    characteristics: '- Fotocopiadora Multifuncional Toner, Disco 250 GB, Memor\n- KONICA MINOLTA BIZHUB C 458',
    brandModel: 'KONICA MINOLTA BIZHUB C 458'
  },
  {
    id: 't11',
    planCode: 'E10',
    description: 'PROYECTOR MULTIMEDIA INCL/PANTALLA ECRAN',
    characteristics: '- Pantalla ECRAN retractil 2.00X1.50m\n- Proyector Multimedia de 3000 Lumes, 1024.768 XGA, USB, HDMI',
    brandModel: 'ECRAN + PROYECTOR'
  },
  {
    id: 't12',
    planCode: 'E11',
    description: 'TELEVISOR DE 40" SMART TV',
    characteristics: '- TV LED SMART TV de 40". HDMI, USB, WiFi, INCL.CONTROL',
    brandModel: 'Smart TV 40"'
  },
  {
    id: 't13',
    planCode: 'E12',
    description: 'LAPTOP CORE I7',
    characteristics: '- Computadora Portatil Laptop CORE I7 2,1 GHZ, 16GB RAM, 1TB',
    brandModel: 'Laptop CORE I7'
  },
  {
    id: 't14',
    planCode: 'E13',
    description: 'TELEFONO IP',
    characteristics: '',
    brandModel: ''
  },
  {
    id: 't15',
    planCode: 'E14',
    description: 'MONITOR DE 55" 4K PROFESIONAL',
    characteristics: '- Monitor LED 55" 4K Profesional, HDMI, VGA, USB, 1080P',
    brandModel: 'Monitor 55" 4K'
  },
  {
    id: 't16',
    planCode: 'E15',
    description: 'IMPRESORA LÁSER MONOCROMÁTICA',
    characteristics: '- Impresora Laser Monocromatico USB 2.0, Pantalla LCD 2 LI\n- HP LASERJET',
    brandModel: 'HP LASERJET'
  },
  {
    id: 't17',
    planCode: 'E16',
    description: 'PROYECTOR MULTIMEDIA INCL/PANTALLA ECRAN EN AUDITORIO',
    characteristics: '- Pantalla ECRAN retractil 2.00X1.50m\n- Proyector Multimedia de 3000 Lumes, 1024.768 XGA, USB, HDMI',
    brandModel: 'ECRAN + PROYECTOR'
  },
  // Equipos en Traslado (Ex#)
  {
    id: 't18',
    planCode: 'Ex1',
    description: 'COMPUTADORA',
    characteristics: 'TRASLADO',
    brandModel: ''
  },
  {
    id: 't19',
    planCode: 'Ex2',
    description: 'IMPRESORA MULTIFUNCIONAL TIPO A',
    characteristics: 'TRASLADO',
    brandModel: ''
  },
  {
    id: 't20',
    planCode: 'Ex3',
    description: 'IMPRESORA MULTIFUNCIONAL TIPO B',
    characteristics: 'TRASLADO',
    brandModel: ''
  },
  {
    id: 't21',
    planCode: 'Ex4',
    description: 'FOTOCOPIADORA MULTIFUNCIONAL',
    characteristics: 'TRASLADO',
    brandModel: ''
  }
];

// DISPOSITIVOS DE EJEMPLO
export const mockDevices: Device[] = [
  // Nuevos dispositivos en Fiscalización
  { id: 'd1', inventoryCode: '', planCode: 'E3', typeId: 't4', status: 'New', floor: 2, destinationOfficeId: 'o4', asignacion: 'asignado' },
  { id: 'd2', inventoryCode: '', planCode: 'E3', typeId: 't4', status: 'New', floor: 2, destinationOfficeId: 'o4', asignacion: 'asignado' },
  { id: 'd3', inventoryCode: '', planCode: 'E3', typeId: 't4', status: 'New', floor: 2, destinationOfficeId: 'o4', asignacion: 'asignado' },
  { id: 'd4', inventoryCode: '', planCode: 'E5', typeId: 't6', status: 'New', floor: 2, destinationOfficeId: 'o4', asignacion: 'asignado' },
  { id: 'd5', inventoryCode: '', planCode: 'E6', typeId: 't7', status: 'New', floor: 2, destinationOfficeId: 'o4', asignacion: 'asignado' },
  { id: 'd6', inventoryCode: '', planCode: 'E9', typeId: 't10', status: 'New', floor: 2, destinationOfficeId: 'o5', asignacion: 'asignado' },
  { id: 'd7', inventoryCode: '', planCode: 'E1', typeId: 't1', status: 'New', floor: 1, destinationOfficeId: 'o1', asignacion: 'asignado' },
  { id: 'd8', inventoryCode: '', planCode: 'E1', typeId: 't1', status: 'New', floor: 1, destinationOfficeId: 'o1', asignacion: 'asignado' },

  // Dispositivos en traslado
  { id: 'd9', inventoryCode: 'INV-2020-001', planCode: 'Ex1', typeId: 't18', status: 'Transfer', floor: 2, destinationOfficeId: 'o4', originOfficeId: 'o1', asignacion: 'asignado' },
  { id: 'd10', inventoryCode: 'INV-2020-002', planCode: 'Ex1', typeId: 't18', status: 'Transfer', floor: 2, destinationOfficeId: 'o4', originOfficeId: 'o2', asignacion: 'asignado' },
  { id: 'd11', inventoryCode: 'INV-2020-003', planCode: 'Ex2', typeId: 't19', status: 'Transfer', floor: 2, destinationOfficeId: 'o5', originOfficeId: 'o1', asignacion: 'asignado' },
];