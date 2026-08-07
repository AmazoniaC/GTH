# Guía del desarrollador · Progrexa

Documento técnico de la plataforma **Progrexa** (SaaS multiempresa de Gestión
de Talento Humano y Nómina para Colombia). Explica la arquitectura, la
estructura del código por partes y cómo continuar el desarrollo.

> Público objetivo: una persona desarrolladora que se incorpora al proyecto y
> necesita entender de qué se compone la app para seguir trabajando.

---

## 1. Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui, React Router, React Hook Form + Zod, TanStack Query, Axios |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | JWT (access + refresh) |
| Arquitectura backend | MVC + Servicios + Repositorio (SOLID) |

Monorepo con dos paquetes: `backend/` y `frontend/`, más un `package.json`
raíz con scripts de orquestación.

---

## 2. Estructura del repositorio

```
GTH/
├── package.json            # Scripts raíz (setup, dev, db:up, ensure:env)
├── docker-compose.yml      # PostgreSQL local
├── docs/
│   └── GUIA_DESARROLLADOR.md   # (este archivo)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Modelo de datos (fuente de verdad)
│   │   └── seed.ts         # Seed (vacío por diseño)
│   └── src/
│       ├── app.ts          # Construcción de Express (middlewares globales)
│       ├── server.ts       # Arranque + bootstrap de dueños de plataforma
│       ├── config/         # env, prisma, módulos, reglas de ausencias
│       ├── core/           # utils, middlewares, errores (infraestructura)
│       ├── modules/        # Módulos de negocio (uno por dominio)
│       └── routes/         # Registro central de routers
└── frontend/
    └── src/
        ├── App.tsx         # Rutas
        ├── main.tsx        # Punto de entrada
        ├── components/     # UI reutilizable (ui/, layout/, shared/, brand/)
        ├── features/       # Módulos de UI (uno por dominio)
        ├── lib/            # api (axios), utils, colombia-geo, colombia-dates
        └── types/          # Tipos TypeScript compartidos del frontend
```

---

## 3. Puesta en marcha

```bash
# 1. Instalar dependencias de raíz, backend y frontend
npm run install:all

# 2. Levantar PostgreSQL (o usa tu propia instancia y edita backend/.env)
npm run db:up

# 3. Crear backend/.env a partir del ejemplo
npm run ensure:env         # copia backend/.env.example -> backend/.env

# 4. Generar cliente Prisma + aplicar migraciones
cd backend
npx prisma generate
npx prisma migrate dev

# 5. Arrancar backend + frontend juntos
cd ..
npm run dev
```

Variables clave de `backend/.env` (ver `backend/.env.example`):

- `DATABASE_URL` — cadena de conexión a PostgreSQL.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — secretos de firma.
- `CORS_ORIGIN` — origen del frontend (por defecto `http://localhost:5173`).
- `PLATFORM_OWNER_EMAILS` — correos con acceso de dueño de plataforma (coma).
- `PLATFORM_OWNER_PASSWORD` — contraseña inicial de esas cuentas.

---

## 4. Conceptos transversales

### 4.1 Multiempresa (multi-tenant)

Todo dato pertenece a una `Organization` mediante la columna `organizationId`.
El `organizationId` viaja dentro del JWT y **cada consulta filtra por él**, de
modo que una empresa nunca ve datos de otra. Los servicios reciben el
`organizationId` desde `req.auth.organizationId`.

### 4.2 Autenticación (JWT)

- `backend/src/modules/auth/` maneja login, refresh y `me`.
- El payload del token es `{ sub, organizationId, role, email }`
  (`core/utils/jwt.ts`).
- `core/middlewares/auth.middleware.ts`:
  - `authenticate` — valida el token y llena `req.auth`.
  - `authorize(...roles)` — restringe por rol.
- El **auto-registro público está deshabilitado**: las empresas las crea el
  dueño de la plataforma (ver 4.4).

### 4.3 Dueño de la plataforma (super admin)

No es un rol de base de datos, sino una condición por correo:

- `config/env.ts` expone `platformOwnerEmails` e `isPlatformOwner(email)`.
- `core/bootstrap/platform-owner.ts` (`ensurePlatformOwners`) se ejecuta al
  arrancar (`server.ts`) y **aprovisiona automáticamente** una cuenta
  `SUPER_ADMIN` por cada correo listado, dentro de una organización interna
  oculta (NIT `PLATFORM-SYSTEM`, constante `PLATFORM_ORG_NIT`).
- El módulo `modules/platform/` expone el panel del super admin (ver 5.16).

### 4.4 Módulos activos y límite de empleados por empresa

- `Organization.modules` (`String[]`) y `Organization.maxEmployees` (`Int?`).
- Catálogo de módulos en `config/modules.ts` (`EMPLOYEES`, `PAYROLL`).
- `core/middlewares/module.middleware.ts` → `requireModule('PAYROLL')`
  bloquea rutas si la empresa no tiene el módulo activo.
- El límite de empleados se valida en `employee.service.create`.
- El super admin edita módulos y límite desde el panel de Plataforma.

### 4.5 Catálogos editables

`modules/catalog/` implementa listas configurables por empresa
(`CatalogOption`). Hay dos clases:

- **Basadas en código** (el código tiene lógica asociada): `DOCUMENT_TYPE`,
  `CONTRACT_TYPE`, `EMPLOYEE_STATUS`, `FILE_TYPE`, `ABSENCE_TYPE`.
- **Basadas en etiqueta** (listas de valores libres): `EPS`, `PENSION_FUND`,
  `BANK`, `ARL`, etc.

`catalog.constants.ts` define las categorías y `DEFAULT_OPTIONS`.
`catalog.service.ensureDefaults()` provisiona las opciones faltantes de cada
empresa la primera vez que se leen (idempotente). Las opciones `isSystem` no
se pueden eliminar (solo renombrar).

En el frontend, `components/shared/catalog-select.tsx` alimenta los selects
desde estas listas (guarda la **etiqueta**), salvo `ABSENCE_TYPE` que se
maneja por **código** en el formulario de ausencias.

---

## 5. Backend por módulos

### 5.1 Anatomía de un módulo

Cada módulo en `backend/src/modules/<dominio>/` sigue la misma estructura por
capas (patrón MVC + Servicio + Repositorio):

```
<dominio>.routes.ts       # Define endpoints, middlewares y validación
<dominio>.controller.ts   # Adapta req/res -> servicio (sin lógica de negocio)
<dominio>.service.ts      # Lógica de negocio (orquesta repositorio y reglas)
<dominio>.repository.ts   # Acceso a datos con Prisma (cuando aplica)
<dominio>.schema.ts       # Esquemas Zod de validación + tipos inferidos
```

El router se registra en `src/routes/index.ts`. Los errores se lanzan con
`core/errors/AppError` (`AppError`, `NotFoundError`, `ConflictError`,
`ForbiddenError`, `UnauthorizedError`) y los captura
`core/middlewares/error.middleware.ts`, que además traduce errores de Prisma
(P2021/P2022, validación) a mensajes claros.

Respuestas estandarizadas con `core/utils/apiResponse.ts` (`ok`, `created`):
`{ status: 'success', data, meta? }`. Las funciones asíncronas se envuelven con
`core/utils/asyncHandler.ts`.

### 5.2 `auth`
Login, refresh, `me`. `toPublicUser()` agrega `isPlatformOwner`. `me()` devuelve
la organización con sus módulos y `maxEmployees`. El registro público está
inhabilitado en `auth.routes.ts`.

### 5.3 `users`
CRUD de usuarios de la empresa y asignación de rol (solo administradores).

### 5.4 `employees`
Núcleo del talento humano. `employee.service.create` valida documento único y
el **límite de empleados** de la empresa. Registra auditoría. Identificador
visible = número de documento (cédula).

**Acceso al portal**: `GET/POST/PATCH /employees/:id/portal-access` y
`POST /employees/portal-access/bulk` crean/gestionan la cuenta de autoservicio
del empleado (rol `EMPLOYEE`, enlazada por `Employee.userId`, contraseña
inicial = número de documento). El toggle `isActive` del usuario habilita o
bloquea el inicio de sesión (el login ya rechaza usuarios inactivos).
`GET /employees/select` incluye el estado de acceso para la creación masiva.

### 5.5 `payroll`
Motor de nómina colombiano. Ver sección 6.

### 5.6 `catalog`
Listas configurables + departamentos y cargos. Ver 4.5.

### 5.7 `dashboard`
Agrega indicadores para el panel principal.

### 5.8 `documents`
Documentos adjuntos del empleado (base64 / data URL).

### 5.9 `contracts`
Historial de contratos y de cambios salariales (`SalaryChange`).

### 5.10 `alerts`
Motor de alertas: contratos por vencer, fin de prueba, documentos por caducar,
cumpleaños.

### 5.11 `dependents`
Grupo familiar / beneficiarios.

### 5.12 `audit`
Bitácora de auditoría (`AuditLog`) con diff de cambios. `auditService.record()`
lo invocan los servicios que modifican datos.

### 5.13 `import`
Importación masiva desde Excel/CSV, con parseo tolerante de fechas
(ISO, DD/MM/AAAA, DD-MM-AAAA).

### 5.14 `resume`
Hoja de vida: formación (`Education`) y experiencia (`WorkExperience`).

### 5.15 `customfields`
Campos personalizados por empresa (`CustomFieldDefinition`), almacenados en
`Employee.customFields` (JSON).

### 5.16 `selfservice`
Endpoints `/me/...` para el portal del empleado (vinculado por
`Employee.userId`).

### 5.17 `organization`
Datos de la empresa (nombre, NIT, representante legal, etc.). GET público al
usuario autenticado; PUT solo administradores.

### 5.18 `platform`
Panel del super admin. Middleware `requirePlatformOwner`. Endpoints:
`GET /platform/summary`, `GET /platform/organizations`,
`POST /platform/organizations` (crear empresa + admin),
`PATCH /platform/organizations/:id` (estado, nombre, módulos, límite),
`DELETE /platform/organizations/:id`,
`POST /platform/organizations/:id/impersonate` (entrar como soporte: emite
tokens de un admin de la empresa). La organización interna se excluye de
listados y conteos.

### 5.19 `absences`
Módulo de Vacaciones y Ausencias. Ver sección 7.

### 5.23 `novelties`
Novedades de nómina (módulo Nómina). `PayrollNovelty` guarda devengados
(horas extra con cálculo automático salario/240×horas×factor —
`config/payroll-novelties.ts`—, bonos, comisiones, auxilios) y deducciones
(préstamos recurrentes por cuotas, otras deducciones). Al liquidar un periodo,
`payroll.service.createPeriod` incorpora las novedades aplicables
(`applicableForPeriod`) como devengados/deducciones extra del desprendible y
luego `markApplied` avanza las cuotas y cierra las puntuales. Endpoints
`/novelties` (catálogo + CRUD), gateados por el módulo PAYROLL.

### 5.22 `reports`
Reportes y analítica (función base, rol RRHH/nómina/admin). `report.service`
expone agregaciones: `headcount` (planta y rotación), `payroll(year)` (costos y
distribución salarial), `absenteeism(from,to)` (días por tipo/área, incapacidades
por origen, top, y pasivo de vacaciones) y `compliance` (alertas, Habeas Data,
distribución de seguridad social). Endpoints bajo `/reports`. El frontend
(`features/reports`) los grafica con recharts y exporta a Excel/CSV con
`lib/export-csv.ts`.

### 5.21 `liquidations`
Liquidación definitiva de contrato. `liquidation.calculator.ts` es una función
pura (con `days360`, convención 30/360) que calcula cesantías + intereses,
prima y vacaciones proporcionales (más salario pendiente, otros conceptos y
deducciones manuales). `liquidation.service` resuelve el contexto (contrato
vigente, auxilio de transporte según SMMLV, saldo de vacaciones del módulo de
ausencias, fechas de corte por defecto), calcula, persiste el `Liquidation` y
—opcionalmente— marca al empleado retirado y cierra su contrato. Endpoints bajo
`/liquidations` (`/reasons`, `/compute`, CRUD). Gateado por
`requireModule('PAYROLL')` y rol de nómina.

### 5.20 `certificates`
Documentos y certificados. Plantillas editables por empresa
(`DocumentTemplate`) con variables `{{grupo.campo}}`. `certificate.constants.ts`
define las plantillas por defecto (certificado laboral con/sin salario,
contrato, paz y salvo, carta), la lista de variables y el resolvedor de
contexto (empleado + contrato + empresa). Endpoints bajo `/documents-gen`:
`GET /variables`, CRUD de `/templates` y `POST /render` (resuelve las variables
por empleado y devuelve el contenido + datos de la empresa para el membrete).
El PDF se produce en el cliente (ventana imprimible con membrete y firma).
Protegido por `requireModule('EMPLOYEES')` y rol RRHH/Admin.

---

## 6. Motor de nómina

Archivos: `modules/payroll/payroll.calculator.ts` (función pura) y
`payroll.service.ts` (orquestación + persistencia).

- `calculatePayroll(input)` recibe salario, días pagados, parámetros legales y
  **devengados adicionales** (`additionalEarnings` con `funder`
  EMPLOYER/EPS/ARL) y devuelve devengados, deducciones, neto, IBC y costo del
  empleador. Es pura y testeable.
- Contempla: auxilio de transporte, IBC (con salario integral al 70%),
  aportes de salud/pensión, fondo de solidaridad, ARL por clase de riesgo,
  parafiscales con exoneración (Ley 1607) y provisiones (cesantías, intereses,
  prima, vacaciones).
- **Costo del empleador**: excluye los devengados financiados por terceros
  (EPS/ARL), que sí suman al neto del empleado pero no cuestan a la empresa.
- `createPeriod` liquida a todos los empleados activos con contrato,
  incorporando las **novedades de ausencias** del mes (ver 7.3).

Parámetros por año en `PayrollConfig` (editables); `payroll.service` usa
`DEFAULT_CONFIG` como referencia 2026 cuando no hay configuración.

---

## 7. Módulo de Vacaciones y Ausencias

### 7.1 Modelo de datos
- `Absence` (empleado, `type` = código del catálogo `ABSENCE_TYPE`, fechas,
  `days`, `status` (enum `AbsenceStatus`), datos de soporte, `affectsPayroll`).
- `VacationAdjustment` (ajustes +/− al saldo de vacaciones).

### 7.2 Reglas colombianas fijas
`config/absence-rules.ts` define, por código de tipo, su comportamiento:

- `dayCount`: `BUSINESS` (hábiles) o `CALENDAR` (calendario).
- `consumesVacation`: descuenta saldo de vacaciones.
- `payroll`: `PAID_EMPLOYER` | `UNPAID` | `INCAPACITY_GENERAL` |
  `INCAPACITY_LABOR` | `LICENSE_EPS`.

Los tipos “de sistema” se siembran como catálogo `ABSENCE_TYPE` (código ligado
a la lógica). Los tipos personalizados usan un comportamiento neutro.

Conteo de días y festivos: `core/utils/colombia-dates.ts` calcula los festivos
de Colombia (incluida la Ley Emiliani) y cuenta días hábiles/calendario. Hay un
espejo en el frontend (`lib/colombia-dates.ts`) para previsualizar la duración.

### 7.3 Integración con nómina
`modules/payroll/absence-novelties.ts` traduce las ausencias del período en:
- días de salario a descontar (no remuneradas),
- devengados por incapacidades/licencias con las reglas fijas (66.67% para
  enfermedad general con días 1-2 a cargo del empleador y piso del SMMLV, 100%
  ARL para laboral, 100% EPS para maternidad/paternidad).

`payroll.service.createPeriod` consulta las ausencias efectivas (APPROVED,
IN_PROGRESS, COMPLETED) que se solapan con el mes y ajusta cada desprendible.

### 7.4 Saldo de vacaciones
`absence.service.vacationBalance`: causación automática de **1.25 días
hábiles/mes** desde el ingreso, más ajustes manuales, menos vacaciones tomadas.

### 7.5 API
`/absences` (CRUD + filtros), `/absences/employees/:id/balance`,
`/absences/adjustments`. Protegido por `requireModule('EMPLOYEES')` y rol de
RRHH/Admin.

### 7.6 Solicitudes y aprobaciones (autoservicio)
El estado `PENDING` del enum `AbsenceStatus` modela las solicitudes. Flujo:
- El empleado solicita desde su portal (`POST /me/absence-requests`), puede
  cancelar la pendiente (`DELETE /me/absence-requests/:id`) y, si es jefe, ver
  y resolver las de su equipo (`GET /me/team/approvals`,
  `PATCH /me/team/approvals/:id/review`).
- RRHH/Admin resuelve todas desde `GET /absences/approvals` y
  `PATCH /absences/:id/review` (más `GET /absences/pending-count` para la
  insignia).
- `absence.service.review` autoriza (RRHH/Admin o jefe directo del solicitante),
  revalida solapamiento al aprobar y registra al aprobador. Los estados
  `PENDING`/`REJECTED`/`CANCELLED` no cuentan en saldo ni en nómina (solo los
  de `EFFECTIVE_STATUSES`).

---

## 8. Frontend por partes

### 8.1 Organización
- `features/<dominio>/` agrupa cada módulo de UI: `*.api.ts` (hooks de TanStack
  Query + Axios), `pages/` y `components/`.
- `lib/api.ts` — instancia Axios con interceptores (token, refresh) y
  `getErrorMessage`.
- `types/index.ts` — tipos compartidos.

### 8.2 Estado de autenticación
`features/auth/auth.store.ts` (Zustand + persist): usuario, tokens,
`isPlatformOwner`, y **modo soporte** (`impersonation` + `ownerSession` para
regresar). `impersonate()` / `exitImpersonation()`.

### 8.3 Layout y navegación
- `components/layout/nav-config.tsx` — define las secciones/ítems del menú.
  Cada ítem puede declarar `roles`, `platformOnly` o `module`.
- `components/layout/sidebar.tsx` — filtra ítems por rol, módulo activo y por
  si el usuario es dueño de plataforma.
- `components/layout/main-layout.tsx` — refresca el usuario con `me()`, muestra
  el banner de “modo soporte” y aplica el guard: el super admin (fuera de modo
  soporte) solo accede a `/platform` y `/manual`.

### 8.4 Rutas
`App.tsx` define las rutas dentro de `ProtectedRoute` + `MainLayout`.
`HomeRedirect` envía al inicio adecuado según el rol (empleado → `/portal`,
super admin → `/platform`, resto → `/dashboard`).

### 8.5 Features destacadas
- `features/platform/` — panel del super admin (crear/configurar/eliminar
  empresas, soporte). `company-dialog.tsx` crea/configura empresas.
- `features/absences/` — módulo de ausencias (lista, formulario, saldos).
  `absence-meta.ts` es el espejo de las reglas para pistas de UI.
- `features/manual/` — manual de uso in-app (visible al super admin y a los
  administradores de cada empresa; ruta `/manual`).
- `features/documents-gen/` — generación de documentos y certificados
  (plantillas con variables + impresión con membrete/firma vía
  `print-documents.ts`).
- `features/settings/sections/options-section.tsx` — edición de catálogos.

### 8.6 UI
`components/ui/` son componentes shadcn/ui (Button, Dialog, Select, Table,
Tabs, Switch, etc.). `components/shared/` son piezas propias (PageHeader,
StatCard, CatalogSelect, PhotoUpload). `components/brand/logo.tsx` define el
logo y `APP_NAME`.

---

## 9. Cómo agregar un nuevo módulo (receta)

1. **Modelo**: agrega el/los modelos a `prisma/schema.prisma` con
   `organizationId` y relación a `Organization`. Ejecuta
   `npx prisma migrate dev --name <nombre>`.
2. **Backend**: crea `modules/<dominio>/` con `routes/controller/service/
   schema` (y `repository` si aplica). Registra el router en
   `routes/index.ts`. Protege con `authenticate`, `authorize(...)` y, si es un
   módulo comercial, `requireModule('<KEY>')` (añádelo a `config/modules.ts`).
3. **Auditoría**: llama a `auditService.record()` en creaciones/cambios.
4. **Frontend**: crea `features/<dominio>/` con `*.api.ts` (hooks) y páginas.
   Agrega la ruta en `App.tsx` y el ítem en `nav-config.tsx`.
5. **Catálogos** (si necesitas listas configurables): agrega la categoría en
   `catalog.constants.ts` con sus `DEFAULT_OPTIONS`.

La arquitectura está pensada para añadir módulos **sin refactorizar** los
existentes: cada dominio es autocontenido y se “enchufa” en el router central y
en la navegación.

---

## 9.b Numeración consecutiva de documentos

`core/utils/sequence.ts` gestiona consecutivos por empresa y por serie
(`LIQUIDATION`→LIQ, `PAYSLIP`→NOM, `DOCUMENT`→DOC) sobre el modelo
`DocumentSequence` (`reserveNumbers` incrementa de forma atómica y admite
reservas en bloque para generaciones masivas). Lo usan la liquidación (campo
`Liquidation.number`), los desprendibles (`Payslip.number`, asignados al crear
el periodo) y la generación de certificados/contratos (número devuelto en el
render).

## 9.c Robustez, pruebas y despliegue

Además de las funcionalidades, la app incorpora una base de robustez para
operar de forma confiable en producción.

### Pruebas automatizadas (Vitest)

El motor de cálculo (funciones puras, sin infraestructura) está cubierto por
pruebas unitarias. Se ejecutan con `npm test` en la raíz (corre backend y
frontend) o por proyecto.

- **Backend** (`backend/tests/`):
  - `payroll.calculator.test.ts`: devengados, deducciones, IBC, exoneración
    de aportes, fondo de solidaridad, salario integral, novedades por
    financiador (EMPLOYER/EPS/ARL).
  - `liquidation.calculator.test.ts`: `days360`, `workedDays360` y la
    liquidación completa (cesantías, intereses, prima, vacaciones).
  - `colombia-dates.test.ts`: festivos con Ley Emiliani (incluye la
    coincidencia de San Pedro y Sagrado Corazón el 30/06/2025), conteo de días
    hábiles y calendario, y el recorte de una ausencia al periodo liquidado.
  - `payroll-novelties.test.ts`: factores y valor de horas extra.
  - `absence-rules.test.ts`: reglas por tipo de ausencia y su efecto en nómina.
- **Frontend** (`frontend/tests/`): `colombia-dates.test.ts` verifica la
  paridad de conteo de días en la UI (`previewAbsenceDays`).

> Las pruebas viven en `tests/` (fuera de `src/`) para no incluirse en el
> build de producción. Al modificar cualquier fórmula o regla legal, ejecuta
> `npm test` y ajusta/añade casos: es la red de seguridad de la nómina.

### Migraciones versionadas de Prisma

El esquema se despliega mediante migraciones versionadas y commiteadas en
`backend/prisma/migrations/` (con `migration_lock.toml`). Flujos:

- Desarrollo (crea/aplica migraciones): `npm run setup` o
  `npm --prefix backend run prisma:migrate`.
- Producción (aplica lo ya versionado, no genera nuevas): `npm run deploy:db`
  → `prisma migrate deploy`.
- Al cambiar `schema.prisma`, genera la migración con
  `prisma migrate dev --name <cambio>` y commitea la carpeta resultante.

### Manejo global de errores y disponibilidad

- `server.ts` verifica la conexión a la base de datos al arrancar (falla
  temprano con un mensaje claro si PostgreSQL no está disponible) y registra
  manejadores `unhandledRejection` / `uncaughtException` para evitar caídas
  silenciosas, con cierre ordenado ante `SIGINT`/`SIGTERM`.
- Sonda de disponibilidad: `GET /api/health` responde `200` con
  `database: "up"` o `503` si la BD no responde (útil para orquestadores).
- La generación de un periodo de nómina (`createPeriod`) es **atómica**: la
  reserva de consecutivos, la creación del periodo con sus desprendibles y el
  marcado de novedades aplicadas ocurren en una sola transacción.

### Seguridad y rendimiento

- **Rate limiting** (`express-rate-limit`): límite estricto en `/auth/login` y
  `/auth/refresh` (10 intentos / 15 min por IP) y un límite general para toda
  la API (300 req/min). En producción se activa `trust proxy` para identificar
  la IP real tras el proxy inverso.
- **Frontend resiliente**: `ErrorBoundary` global muestra una pantalla amigable
  ante un error de render en vez de dejar la app en blanco.
- **Code-splitting**: las páginas se cargan con `lazy()` + `Suspense` (un chunk
  por ruta) y las dependencias grandes (React, TanStack/axios, recharts) se
  agrupan en paquetes cacheables (`manualChunks`), reduciendo la carga inicial.

---

## 9.d Módulo de Contratación y Selección

Módulo `RECRUITMENT` (gated por empresa). Centraliza el ciclo completo de
contratación de personal en Colombia e integra con Talento Humano y Nómina.

### Reglas legales (`config/recruitment.ts`)

Refleja la legislación vigente y la Reforma Laboral (Ley 2466 de 2025):

- **Modalidades de contrato** (`CONTRACT_MODALITIES`): indefinido (regla
  general por defecto), término fijo, obra o labor, aprendizaje y ocasional.
  Cada una con su nota legal y si requiere fecha de fin.
- **Período de prueba** (`suggestedProbationDays`, `isProbationValid`): máximo
  2 meses; en fijos inferiores a 1 año, 1/5 del término pactado sin exceder 2
  meses; el aprendizaje no tiene período de prueba. Cubierto por pruebas
  (`tests/recruitment.test.ts`).
- **Documentos obligatorios** (`REQUIRED_DOCUMENT_TYPES`) y **plantilla de
  onboarding** (`ONBOARDING_TEMPLATE`): afiliaciones (EPS, AFP, ARL, CCF,
  cesantías), firma, dotación, inducción y seguimiento del período de prueba.

### Modelo de datos (Prisma)

`Vacancy` → `Application` (postulación) ← `Candidate`. La postulación agrupa
`Interview[]`, `ApplicationDocument[]`, `JobOffer?` y `OnboardingTask[]`. La
etapa (`ApplicationStage`) modela el embudo: APPLIED → SCREENING → INTERVIEW →
TECHNICAL_TEST → OFFER → HIRED (o REJECTED/WITHDRAWN).

### Backend (`modules/recruitment/`)

`schema` (Zod) · `service` · `controller` · `routes`. Rutas bajo
`/recruitment`, protegidas con `requireModule('RECRUITMENT')` y restringidas a
ADMIN/HR_MANAGER/SUPER_ADMIN. Todas las operaciones quedan en auditoría.

- Vacantes: CRUD + consecutivo `VAC-000001`.
- Postulaciones: crea o reutiliza el candidato por documento; mover de etapa;
  checklist de documentos con verificación; entrevistas con puntaje.
- Oferta (`JobOffer`): valida la modalidad (fecha de fin obligatoria cuando
  aplica) y el período de prueba; genera contrato interno.
- **Contratar** (`hire`): en una transacción crea el `Employee` + `Contract`,
  marca la postulación como HIRED, cubre la vacante cuando se llenan las plazas
  y siembra el onboarding. **No duplica lógica**: delega la creación del
  empleado en `employeeService.createRecord()` — la **única** función canónica
  de alta de empleados, tx-aware, que también usa el alta directa/importación.
  Así el límite del plan, el control de duplicados, el contrato y las
  validaciones viven en un solo lugar. La modalidad de la oferta se mapea al
  catálogo `CONTRACT_TYPE` y el período de prueba se traslada al contrato.
- **Un registro, dos caminos** (estándar de los ERP): el empleado es único y
  se llega a él por contratación (camino principal) o por alta directa/Excel
  (carga inicial, recontratación, altas express). `GET /recruitment/origin/:id`
  expone de qué vacante salió un empleado; su ficha muestra “Contratado desde
  VAC-…”.
- Firma: registro interno (marcar firmado + adjuntar el contrato firmado como
  data URL). Preparado para integrar un proveedor externo en el futuro.

### Frontend (`features/recruitment/`)

- `recruitment.api.ts`: hooks de TanStack Query y etiquetas.
- `pages/vacancies-page.tsx`: tarjetas de vacantes, métricas y alta.
- `pages/vacancy-detail-page.tsx`: tablero del embudo por etapas + postular
  candidato.
- `pages/application-detail-page.tsx`: hub del candidato con pestañas (perfil,
  entrevistas, documentos, oferta/contrato, onboarding) y botón Contratar.

Rutas `lazy()` en `App.tsx` (`/recruitment`, `/recruitment/vacancies/:id`,
`/recruitment/applications/:id`) y sección “Contratación” en el menú.

---

## 10. Convenciones

- TypeScript estricto en ambos lados (`tsc --noEmit` debe pasar limpio).
- Idioma del dominio y de la UI: español (Colombia).
- Commits descriptivos; los cambios de esquema requieren migración Prisma.
- No se exponen secretos ni `.env` reales (gitignored).
- Fechas: cuidado con zonas horarias; usar utilidades de `lib/utils`
  (`formatDate`, `toDateInput`) y `colombia-dates` para días hábiles.

---

## 11. Estado actual (resumen de lo construido)

- Multiempresa con aislamiento por `organizationId` y JWT.
- Módulos: Empleados (completo, con importación, documentos, hoja de vida,
  grupo familiar, contratos e historial salarial, campos personalizados),
  Nómina (motor colombiano + simulador), Vacaciones y Ausencias (con
  integración a nómina), Organigrama, Alertas, Auditoría, Portal del empleado.
- Configuración: datos de empresa, catálogos editables, campos personalizados,
  usuarios y roles.
- Dueño de plataforma (super admin): panel para crear/configurar/eliminar
  empresas, asignar módulos y límite de empleados, y entrar como soporte
  (impersonación). Manual de uso in-app.
- Cumplimiento Colombia: Habeas Data, parámetros de nómina legales, festivos
  con Ley Emiliani.
- Contratación y Selección (módulo `RECRUITMENT`): vacantes, candidatos y
  hojas de vida, embudo de selección, entrevistas, validación de documentos,
  generación y firma de contratos (Ley 2466/2025), afiliaciones, dotación,
  inducción y período de prueba, con contratación integrada a Empleados.
- Robustez: pruebas unitarias del motor de cálculo, migraciones versionadas,
  manejo global de errores + health-check, generación de nómina atómica,
  rate limiting, `ErrorBoundary` y code-splitting.

Pendientes/ideas para continuar: nómina electrónica DIAN, PILA, archivo de
dispersión bancaria, control de asistencia, calendario visual de ausencias,
cambio automático de estado del empleado durante licencias.
