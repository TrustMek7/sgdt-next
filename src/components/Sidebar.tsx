'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MonitorSmartphone,
  Archive,
  Building2,
  Map,
  Tags,
  FileBarChart,
  LogOut } from
'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
{
  path: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard
},
{
  path: '/devices',
  label: 'Dispositivos',
  icon: MonitorSmartphone
},
{
  path: '/bajas',
  label: 'Bajas',
  icon: Archive
},
{
  path: '/offices',
  label: 'Oficinas',
  icon: Building2
},
{
  path: '/areas',
  label: 'Áreas',
  icon: Map
},
{
  path: '/types',
  label: 'Tipos (Leyenda)',
  icon: Tags
},
{
  path: '/reports',
  label: 'Reportes',
  icon: FileBarChart
}] as const;

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    router.replace('/login');
  };

  return (
    <div className="w-64 bg-sidebar h-screen flex flex-col text-white fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center font-bold text-lg">
          S
        </div>
        <span className="font-bold text-xl tracking-wide">SGDT</span>
      </div>

      {user && (
        <div className="px-6 py-4 border-b border-white/10 text-sm">
          <div className="text-gray-300">Conectado como</div>
          <div className="font-semibold text-white">{user.name}</div>
        </div>
      )}

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) =>
        <Link
          key={item.path}
          href={item.path}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === item.path ? 'bg-accent text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        >
            <item.icon className="w-5 h-5" />
            {item.label}
        </Link>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
          
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

}