'use client';

import React, { useMemo } from 'react';
import {
  Monitor,
  PlusCircle,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useReports } from '../hooks/useReports';

export function Dashboard() {
  const { devices, deviceTypes, clasificaciones, totals } = useReports();

  const chartData = useMemo(() => {
    if (!clasificaciones.length) return [];

    const counts: Record<string, { name: string; Nuevos: number; Traslados: number }> = {};
    for (const c of clasificaciones) {
      counts[c.id] = { name: c.name, Nuevos: 0, Traslados: 0 };
    }
    counts['__sin_clasif__'] = { name: 'Sin clasificación', Nuevos: 0, Traslados: 0 };

    for (const device of devices) {
      if (device.asignacion !== 'asignado') continue;
      const type = deviceTypes.find((t) => t.id === device.typeId);
      const key = type?.clasificacionId && counts[type.clasificacionId] ? type.clasificacionId : '__sin_clasif__';
      if (device.status === 'New') counts[key].Nuevos += 1;
      else counts[key].Traslados += 1;
    }

    return Object.values(counts).filter((c) => c.Nuevos > 0 || c.Traslados > 0);
  }, [devices, deviceTypes, clasificaciones]);

  const stats = [
    {
      label: 'Total Dispositivos',
      value: totals?.devices ?? devices.length,
      icon: Monitor,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Asignados',
      value: totals?.asignados ?? 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Pendientes',
      value: totals?.pendientes ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Nuevos',
      value: totals?.newDevices ?? 0,
      icon: PlusCircle,
      color: 'text-status-new',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Traslados',
      value: totals?.transferDevices ?? 0,
      icon: ArrowRightLeft,
      color: 'text-status-transfer',
      bg: 'bg-orange-100',
    },
    {
      label: 'Bajas',
      value: totals?.bajas ?? 0,
      icon: Trash2,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex flex-col items-center gap-2 text-center"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Dispositivos por clasificación</h2>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Sin datos de clasificación disponibles</p>
        ) : (
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Nuevos" fill="#27AE60" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Traslados" fill="#F39C12" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
