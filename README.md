# GTH · Gestión de Talento Humano

Aplicación **SaaS de Recursos Humanos y Nómina para Colombia**, moderna, modular
y escalable. Diseñada con una arquitectura que permite incorporar nuevos módulos
en el futuro sin modificar el núcleo.

> **Módulos incluidos actualmente:** Gestión de Empleados y Nómina.
> La arquitectura queda preparada para crecer (Vacaciones, Reclutamiento, etc.).

---

## ✨ Características

- **Multi-empresa (multi-tenant)** por organización.
- **Gestión de Empleados**: datos personales, laborales, seguridad social,
  contratos y datos bancarios.
- **Nómina colombiana**: liquidación automática con salud, pensión, FSP, ARL por
  clase de riesgo, parafiscales, provisiones de prestaciones sociales, auxilio de
  transporte y exoneración de aportes (Ley 1607).
- **Simulador de nómina** en tiempo real.
- **Parámetros legales configurables por año** (SMMLV, auxilio de transporte, UVT…).
- **Dashboard** con métricas y gráficos.
- **Autenticación JWT** con refresh token y control de roles.
- **Interfaz moderna** estilo SAP SuccessFactors / Factorial / Workday, con
  modo claro y oscuro, totalmente responsive.

---

## 🧱 Arquitectura y tecnología

| Capa        | Tecnologías |
|-------------|-------------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, React Hook Form, Zod, TanStack Query, Axios, Recharts |
| **Backend**  | Node.js, Express, TypeScript |
| **Base de datos** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | JWT (access + refresh) |
| **Patrón** | MVC + Services + Repository, principios SOLID |

### Estructura del backend (modular)

```
backend/src/
├── config/         # Entorno y cliente Prisma
├── core/           # Errores, middlewares, utilidades, repositorio base
├── modules/        # Cada módulo es autocontenido
│   ├── auth/       #   controller · service · routes · schema
│   ├── employees/  #   + repository (patrón Repository)
│   ├── payroll/    #   + calculator + constants (motor de nómina)
│   ├── catalog/    #   departamentos y cargos
│   └── dashboard/
└── routes/         # Registro central de módulos
```

Para **añadir un módulo nuevo** basta con crear su carpeta en `modules/` y
registrar su router en `routes/index.ts`. El resto de la arquitectura no cambia.

### Estructura del frontend (feature-based)

```
frontend/src/
├── components/
│   ├── ui/         # Primitivas shadcn/ui
│   ├── layout/     # Sidebar, Topbar, Layout principal
│   ├── theme/      # Proveedor y toggle de tema claro/oscuro
│   └── shared/     # Componentes reutilizables (StatCard, PageHeader…)
├── features/       # Cada módulo con sus páginas, API y componentes
│   ├── auth/  employees/  payroll/  dashboard/  settings/
├── lib/            # Axios, utilidades, query client
└── types/          # Tipos compartidos
```

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js 20+
- Docker Desktop (para la base de datos) **o** PostgreSQL 14+ instalado

### Opción A — rápida (scripts desde la raíz)

Desde la carpeta raíz del proyecto:

```bash
npm run install:all   # instala raíz + backend + frontend
npm run db:up         # levanta PostgreSQL con Docker
npm run setup         # crea el .env, aplica migraciones y datos de demo
npm run dev           # arranca backend y frontend a la vez
```

Luego abre **http://localhost:5173** en el navegador.

### Opción B — manual (paso a paso)

```bash
# 1) Base de datos (Docker)
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev                   # http://localhost:4000/api/v1

# 3) Frontend (en otra terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

> **¿Sin Docker?** Instala PostgreSQL, crea una base `gth_hr` y ajusta
> `DATABASE_URL` en `backend/.env`.

### Credenciales de demostración

```
Correo:      admin@innovatalento.co
Contraseña:  Admin123*
```

---

## 🧮 Notas sobre la nómina colombiana

El motor de cálculo (`backend/src/modules/payroll/payroll.calculator.ts`) es una
función pura y fácil de testear. Aplica:

- **Deducciones del empleado:** salud (4%), pensión (4%) y Fondo de Solidaridad
  Pensional (1% desde 4 SMMLV).
- **Aportes del empleador:** salud (8,5%), pensión (12%), ARL según clase de
  riesgo (Decreto 1772/1994) y parafiscales (SENA 2%, ICBF 3%, Caja 4%).
- **Provisiones de prestaciones:** cesantías (8,33%), intereses de cesantías,
  prima de servicios (8,33%) y vacaciones (4,17%).
- **Exoneración de aportes** (Ley 1607, art. 114-1) para salarios < 10 SMMLV.
- **Salario integral:** IBC sobre el 70%.

Todos los valores legales (SMMLV, auxilio de transporte, UVT y porcentajes) se
almacenan en la tabla `PayrollConfig` y pueden ajustarse por año desde la
interfaz, sin desplegar código.

> Los valores por defecto son de referencia; verifica y ajusta los parámetros
> vigentes del año en el módulo **Nómina → Parámetros**.
