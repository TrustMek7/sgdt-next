'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AppProviders } from '../components/AppProviders';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Ingresa correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success(`¡Bienvenido ${email}!`);
        router.replace('/dashboard');
      } else {
        setError('Credenciales incorrectas');
        toast.error('Credenciales inválidas');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al intentar iniciar sesión');
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SGDT</h1>
          <p className="text-gray-600">Sistema de Gestión de Traslado de Dispositivos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="admin@sgdt.local"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-200">
              <strong>Credenciales de prueba:</strong>
              <div className="mt-1 font-mono text-xs">
                <div>admin@sgdt.local / Admin123!@#</div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Acceder
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>Migración Tecnológica - Palacio Municipal</p>
            <p className="text-xs text-gray-500 mt-1">Versión 1.0 - Abril 2026</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-white bg-opacity-50 rounded-lg backdrop-blur-sm text-center text-sm text-gray-600">
          <p>Sistema de transición durante la migración al nuevo edificio</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AppProviders>
      <Login />
    </AppProviders>
  );
}
