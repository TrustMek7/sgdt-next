'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-sidebar text-white sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded hover:bg-white/10 transition"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg tracking-wide">SGDT</span>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
