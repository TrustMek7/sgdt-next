# SGDT Frontend

Frontend del Sistema de Gestión de Dispositivos y Telecomunicaciones.
Construido con **Next.js 14** (App Router) + **Supabase** (auth + base de datos).

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Supabase JS SDK (auth + PostgreSQL)
- TailwindCSS
- Recharts (gráficos)
- @react-pdf/renderer (exportar PDF)
- xlsx (exportar Excel)

## Instalación

```bash
npm install
```

Configura las variables de entorno en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Desarrollo

```bash
npm run dev
```

## Flujo de datos

```
Pages → Hooks → Services → lib/api.ts → Supabase
```

- Las **pages** renderizan UI y formularios.
- Los **hooks** encapsulan estado y CRUD.
- Los **services** son wrappers delgados sobre `lib/api.ts`.
- `lib/api.ts` accede directamente a Supabase (sin servidor intermedio).

## Imágenes de dispositivos

Las imágenes deben estar disponibles por URL pública para que se muestren tanto en pantalla como en los PDFs generados.
