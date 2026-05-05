'use client';

import React from 'react';
import {
  Monitor,
  PlusCircle,
  ArrowRightLeft,
  AlertTriangle,
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
  const { devices, deviceTypes } = useReports();
  const totalDevices = devices.length;
  const newDevices = devices.filter((device) => device.status === 'New').length;
  const transferDevices = devices.filter((device) => device.status === 'Transfer').length;
  const missingCode = devices.filter((device) => !device.inventoryCode).length;

  const chartData = [
    { name: 'Computers', New: 0, Transfer: 0 },
    { name: 'Printers', New: 0, Transfer: 0 },
    { name: 'Others', New: 0, Transfer: 0 },
  ];

  devices.forEach((device) => {
    const type = deviceTypes.find((item) => item.id === device.typeId);
    if (!type) return;
    let categoryIndex = 2;
    if (type.description.toLowerCase().includes('computadora')) categoryIndex = 0;
    else if (type.description.toLowerCase().includes('impresora')) categoryIndex = 1;

    if (device.status === 'New') {
      chartData[categoryIndex].New += 1;
    } else {
      chartData[categoryIndex].Transfer += 1;
    }
  });

  const stats = [
    {
      label: 'Total Devices',
      value: totalDevices,
      icon: Monitor,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'New Devices',
      value: newDevices,
      icon: PlusCircle,
      color: 'text-status-new',
      bg: 'bg-green-100',
    },
    {
      label: 'Transfers',
      value: transferDevices,
      icon: ArrowRightLeft,
      color: 'text-status-transfer',
      bg: 'bg-orange-100',
    },
    {
      label: 'Missing Inv. Code',
      value: missingCode,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Devices by Category</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend iconType="circle" />
              <Bar dataKey="New" fill="#27AE60" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="Transfer" fill="#F39C12" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
