'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, MonitorSmartphone, Archive, Building2,
  Layers, Network, Tags, Boxes, FileBarChart, LogOut, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { path: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/devices',         label: 'Dispositivos',     icon: MonitorSmartphone },
  { path: '/bajas',           label: 'Bajas',            icon: Archive },
  { path: '/offices',         label: 'Áreas',            icon: Building2 },
  { path: '/areas',           label: 'Subgerencias',     icon: Layers },
  { path: '/dependencias',    label: 'Dependencias',     icon: Network },
  { path: '/types',           label: 'Tipos (Leyenda)',  icon: Tags },
  { path: '/clasificaciones', label: 'Clasificaciones',  icon: Boxes },
  { path: '/reports',         label: 'Reportes',         icon: FileBarChart },
] as const;

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    router.replace('/login');
  };

  return (
    <>
      {/* Overlay oscuro en móvil cuando el drawer está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel del sidebar */}
      <div className={`
        w-64 bg-sidebar h-screen flex flex-col text-white
        fixed left-0 top-0 z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center font-bold text-lg shrink-0">
            S
          </div>
          <span className="font-bold text-xl tracking-wide">SGDT</span>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1 text-gray-300 hover:text-white transition"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user && (
          <div className="px-6 py-4 border-b border-white/10 text-sm">
            <div className="text-gray-300">Conectado como</div>
            <div className="font-semibold text-white truncate">{user.name}</div>
          </div>
        )}

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                pathname === item.path
                  ? 'bg-accent text-white font-medium'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
