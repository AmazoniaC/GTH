import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogoMark } from '@/components/brand/logo';

/**
 * Manual de usuario de Progrexa. Visible para el dueño de la plataforma y para
 * los administradores de cada empresa. Explica el uso completo de la app.
 * Usa `window.print()` para exportarlo a PDF/imprimirlo.
 */
export function ManualPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manual de uso</h1>
          <p className="text-sm text-muted-foreground">
            Guía completa del uso de Progrexa.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </Button>
      </div>

      <Card className="p-8 print:border-0 print:shadow-none">
        {/* Portada */}
        <div className="mb-8 flex items-center gap-3 border-b border-border pb-6">
          <LogoMark className="h-12 w-12" />
          <div>
            <p className="text-xl font-extrabold tracking-tight">Progrexa</p>
            <p className="text-sm text-muted-foreground">
              Plataforma de Gestión de Talento Humano y Nómina · Colombia
            </p>
          </div>
        </div>

        {/* Índice */}
        <Toc />

        <Section id="intro" title="1. Introducción y acceso">
          <p>
            Progrexa es una plataforma en la nube para administrar el personal y la nómina de tu
            empresa conforme a la legislación colombiana. Cada empresa tiene su propio espacio
            aislado y seguro (multiempresa).
          </p>
          <Steps
            items={[
              'Ingresa a la dirección de la aplicación que te compartió el administrador de la plataforma.',
              'Escribe tu correo y contraseña en la pantalla de inicio de sesión y pulsa “Ingresar”.',
              'El acceso lo crea el administrador de la plataforma; no hay auto-registro público.',
            ]}
          />
          <Note>
            Si olvidaste tu contraseña o necesitas un nuevo usuario, solicítalo al administrador de
            tu empresa o al administrador de la plataforma.
          </Note>
        </Section>

        <Section id="roles" title="2. Roles y permisos">
          <p>La aplicación maneja distintos roles. Cada uno ve y hace cosas diferentes:</p>
          <Table
            head={['Rol', 'Qué puede hacer']}
            rows={[
              ['Administrador', 'Acceso total: empleados, nómina, ausencias, usuarios, configuración y auditoría.'],
              ['Gestor de RRHH', 'Gestiona empleados, ausencias y su información; no toca la parametrización de nómina.'],
              ['Gestor de Nómina', 'Liquida y administra la nómina y sus parámetros.'],
              ['Empleado', 'Solo su Portal: consulta sus datos, desprendibles y ausencias.'],
            ]}
          />
        </Section>

        <Section id="dashboard" title="3. Panel principal y Reportes">
          <p>
            Al ingresar verás el <b>Panel</b> con los indicadores clave: número de empleados
            (activos, en licencia, retirados), empleados por departamento, la última nómina y la
            tendencia de costos.
          </p>
          <p>
            En <b>Reportes</b> (para RRHH, nómina y administradores) encuentras tableros con
            gráficas y <b>exportación a Excel</b>:
          </p>
          <Bullets
            items={[
              'Planta y rotación: empleados por área, contrato, género, antigüedad y edad; altas y bajas por mes.',
              'Costos de nómina: tendencia mensual, costo por área, distribución salarial (por año).',
              'Ausentismo: días por tipo y área, incapacidades por origen, top de ausencias y pasivo de vacaciones.',
              'Cumplimiento: contratos/pruebas/documentos por vencer, Habeas Data y distribución por EPS/pensión/ARL/caja.',
            ]}
          />
        </Section>

        <Section id="empleados" title="4. Empleados">
          <p>
            En <b>Empleados</b> administras toda la información del personal. La cédula (número de
            documento) es el identificador principal.
          </p>
          <SubTitle>Crear o editar un empleado</SubTitle>
          <Steps
            items={[
              'Pulsa “Nuevo empleado” (o el ícono de editar en un empleado existente).',
              'Completa los datos personales, de contacto, organización (departamento, cargo, jefe directo), seguridad social y datos bancarios.',
              'Sube la fotografía y guarda. Los campos de listas (EPS, banco, etc.) se eligen de catálogos configurables.',
            ]}
          />
          <SubTitle>Funciones adicionales de la ficha</SubTitle>
          <Bullets
            items={[
              'Documentos: adjunta contrato, cédula, exámenes, certificados, etc.',
              'Hoja de vida: formación académica y experiencia laboral.',
              'Grupo familiar / beneficiarios.',
              'Historial de contratos y de cambios salariales.',
              'Consentimiento de tratamiento de datos (Habeas Data, Ley 1581).',
              'Acceso al portal: crea la cuenta de autoservicio del empleado (contraseña inicial = número de documento) y puedes activarla o inhabilitarla en cualquier momento.',
            ]}
          />
          <Note>
            Para dar acceso a varios a la vez, usa el botón “Accesos al portal” en la lista de
            empleados (creación masiva). Solo aplica a empleados con correo registrado.
          </Note>
          <SubTitle>Importar empleados masivamente</SubTitle>
          <Steps
            items={[
              'Pulsa “Importar” y descarga la plantilla de ejemplo (Excel/CSV).',
              'Llena la plantilla respetando el formato de fechas (AAAA-MM-DD o DD/MM/AAAA).',
              'Sube el archivo; el sistema valida y crea los empleados. Reporta las filas con error.',
            ]}
          />
        </Section>

        <Section id="ausencias" title="5. Vacaciones y Ausencias">
          <p>
            El módulo <b>Ausencias</b> gestiona vacaciones, incapacidades, licencias y permisos, y
            se refleja automáticamente en la nómina.
          </p>
          <SubTitle>Registrar una ausencia</SubTitle>
          <Steps
            items={[
              'Pulsa “Registrar ausencia”, elige el empleado y el tipo (Vacaciones, Incapacidad, Licencia, Permiso…).',
              'Indica las fechas: el sistema calcula la duración (días hábiles con festivos de Colombia para vacaciones/permisos, o días calendario para incapacidades/licencias).',
              'Para incapacidades/licencias, registra la entidad (EPS/ARL), el número de soporte y el diagnóstico.',
              'Asigna el estado (Aprobada, En disfrute, Disfrutada, Rechazada o Cancelada) y guarda.',
            ]}
          />
          <SubTitle>Saldo de vacaciones</SubTitle>
          <p>
            En la pestaña <b>Saldos de vacaciones</b> consultas el saldo de cada empleado. El
            sistema causa automáticamente <b>1.25 días hábiles por mes</b> trabajado desde el
            ingreso. Puedes hacer ajustes manuales (+/−) con su motivo, y verás el historial.
          </p>
          <SubTitle>Efecto en nómina</SubTitle>
          <Table
            head={['Tipo', 'Cómo se paga']}
            rows={[
              ['Vacaciones / Permiso remunerado / Luto', 'Salario normal 100% (empleador).'],
              ['Incapacidad general (EPS)', '66.67%: días 1-2 los paga el empleador, del 3 en adelante la EPS (piso salario mínimo).'],
              ['Incapacidad laboral (ARL)', '100% a cargo de la ARL desde el día 1.'],
              ['Licencia maternidad / paternidad', '100% a cargo de la EPS.'],
              ['Licencia / permiso no remunerado', 'Se descuentan esos días del salario.'],
            ]}
          />
        </Section>

        <Section id="documentos" title="6. Documentos y certificados">
          <p>
            En <b>Documentos</b> generas certificados laborales, contratos, paz y salvo y cartas a
            partir de plantillas, con el membrete de tu empresa y espacio para la firma del
            representante legal.
          </p>
          <SubTitle>Generar un documento</SubTitle>
          <Steps
            items={[
              'Entra a “Documentos” → pestaña “Generar”.',
              'Elige la plantilla (por ejemplo, Certificado laboral con o sin salario).',
              'Selecciona uno o varios empleados (puedes buscar y usar “Seleccionar todos” para generación masiva).',
              'Pulsa “Generar”: se abre el documento listo para imprimir o guardar como PDF.',
            ]}
          />
          <SubTitle>Plantillas editables</SubTitle>
          <p>
            En la pestaña <b>Plantillas</b> editas el texto de cada documento e insertas variables
            como <code>{'{{empleado.nombreCompleto}}'}</code>, <code>{'{{empleado.cargo}}'}</code> o{' '}
            <code>{'{{contrato.salario}}'}</code>, que se reemplazan con los datos reales al generar.
            Puedes crear tus propias plantillas; las del sistema se pueden editar pero no eliminar.
          </p>
        </Section>

        <Section id="nomina" title="7. Nómina">
          <SubTitle>Parámetros de nómina</SubTitle>
          <p>
            Antes de liquidar, revisa los parámetros del año (salario mínimo, auxilio de transporte,
            UVT y porcentajes de aportes y provisiones) en la configuración de nómina. Vienen con
            valores de referencia y son editables.
          </p>
          <SubTitle>Liquidar una nómina</SubTitle>
          <Steps
            items={[
              'Entra a “Nóminas” y pulsa “Nueva nómina”. Elige el mes, el tipo (mensual/quincenal) y los días.',
              'El sistema liquida a todos los empleados activos con contrato vigente e incluye las novedades de ausencias del período.',
              'Revisa los desprendibles: devengados, deducciones, neto y costo del empleador.',
              'Con “Desprendibles (PDF)” generas de una vez las colillas de todo el período (una por página) para imprimir o guardar como un solo PDF.',
              'Con “Enviar por correo” cada empleado recibe su desprendible en su correo (requiere configurar el correo saliente/SMTP del servidor).',
              'Cambia el estado del período (Procesada, Aprobada, Pagada) según tu flujo.',
            ]}
          />
          <SubTitle>Liquidación definitiva de contrato</SubTitle>
          <Steps
            items={[
              'Entra a “Liquidaciones” → “Nueva liquidación”.',
              'Elige el empleado, la fecha de retiro y el motivo; opcionalmente los días de salario pendientes y otros conceptos/deducciones.',
              'Pulsa “Calcular”: verás cesantías e intereses, prima y vacaciones proporcionales, con el neto a pagar.',
              'Guarda; se genera el desprendible imprimible y (si lo dejas marcado) el empleado queda retirado y su contrato cerrado.',
            ]}
          />
          <SubTitle>Simulador</SubTitle>
          <p>
            Usa el <b>Simulador</b> para calcular el neto y el costo de un salario sin crear una
            nómina real: ideal para ofertas laborales o proyecciones.
          </p>
        </Section>

        <Section id="organigrama" title="8. Organigrama">
          <p>
            Visualiza la estructura jerárquica de la empresa a partir del “jefe directo” asignado a
            cada empleado. Se actualiza automáticamente cuando cambias esa relación.
          </p>
        </Section>

        <Section id="alertas" title="9. Alertas">
          <p>
            El módulo <b>Alertas</b> te avisa de eventos importantes: contratos por vencer, fin de
            período de prueba, documentos por caducar y cumpleaños. Ayuda a no dejar pasar fechas
            clave.
          </p>
        </Section>

        <Section id="auditoria" title="10. Auditoría">
          <p>
            La <b>Auditoría</b> registra quién creó, modificó o eliminó información (empleados,
            contratos, ausencias, etc.), con el detalle de los cambios. Es la trazabilidad de la
            operación.
          </p>
        </Section>

        <Section id="config" title="11. Configuración">
          <Bullets
            items={[
              'Datos de la empresa: nombre, NIT, representante legal, dirección, etc.',
              'Logo de la empresa: súbelo en “Datos de la empresa”; aparecerá en el membrete de los documentos (desprendible, certificados, contrato y liquidación).',
              'Listas editables (catálogos): tipos de documento, EPS, fondos, bancos, tipos de ausencia, estados, y más, agrupados por tema.',
              'Campos personalizados: agrega campos propios a la ficha del empleado.',
              'Usuarios: crea usuarios y asígnales su rol (solo administradores).',
            ]}
          />
          <Note>
            Algunas opciones son “del sistema” y no se pueden eliminar (solo renombrar) porque su
            código está ligado a la lógica de nómina o de la aplicación.
          </Note>
        </Section>

        <Section id="portal" title="12. Portal del empleado (autoservicio)">
          <p>
            Los usuarios con rol <b>Empleado</b> ingresan a su <b>Portal</b>, donde consultan sus
            datos personales, sus desprendibles de nómina y sus ausencias, sin acceso al resto de la
            plataforma.
          </p>
          <SubTitle>Solicitudes y aprobaciones</SubTitle>
          <Bullets
            items={[
              'El empleado solicita vacaciones o permisos con el botón “Solicitar”; la solicitud queda pendiente y puede cancelarla mientras no se apruebe.',
              'El jefe directo ve “Solicitudes de mi equipo” en su portal y puede aprobar o rechazar.',
              'RRHH/Admin también aprueba o rechaza desde Ausencias → pestaña “Solicitudes”.',
              'Al aprobarse, la solicitud se convierte en una ausencia efectiva (afecta saldo y nómina).',
            ]}
          />
        </Section>

        <Section id="plataforma" title="13. Panel de Plataforma (administrador de la plataforma)">
          <p>
            El administrador de la plataforma (super admin) gestiona todas las empresas desde el
            panel <b>Plataforma</b>:
          </p>
          <Bullets
            items={[
              'Crear empresas junto con su usuario administrador.',
              'Asignar los módulos activos de cada empresa (Gestión de Empleados, Nómina).',
              'Definir el límite de empleados de cada empresa (o dejarlo ilimitado).',
              'Activar o desactivar una empresa.',
              'Entrar “como soporte” a una empresa (impersonación) para ayudarla, con un aviso visible y opción de salir.',
              'Eliminar una empresa por completo.',
            ]}
          />
          <Note>
            Este panel es exclusivo del administrador de la plataforma. Las empresas no lo ven; solo
            ven los módulos que se les hayan activado.
          </Note>
        </Section>

        <Section id="cumplimiento" title="14. Cumplimiento y datos (Colombia)">
          <Bullets
            items={[
              'Habeas Data (Ley 1581 de 2012): se registra el consentimiento de tratamiento de datos de cada empleado.',
              'Nómina conforme a la normativa: aportes, parafiscales, provisiones, exoneraciones (Ley 1607) y auxilio de transporte.',
              'Festivos de Colombia calculados automáticamente (incluida la Ley Emiliani) para el conteo de días.',
            ]}
          />
        </Section>

        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Progrexa · Manual de uso · Documento generado desde la aplicación.
        </p>
      </Card>
    </div>
  );
}

/* --------------------------- Componentes de apoyo -------------------------- */

const TOC_ITEMS = [
  ['intro', '1. Introducción y acceso'],
  ['roles', '2. Roles y permisos'],
  ['dashboard', '3. Panel principal'],
  ['empleados', '4. Empleados'],
  ['ausencias', '5. Vacaciones y Ausencias'],
  ['nomina', '6. Nómina'],
  ['organigrama', '7. Organigrama'],
  ['alertas', '8. Alertas'],
  ['auditoria', '9. Auditoría'],
  ['config', '10. Configuración'],
  ['portal', '11. Portal del empleado'],
  ['plataforma', '12. Panel de Plataforma'],
  ['cumplimiento', '13. Cumplimiento y datos'],
];

function Toc() {
  return (
    <div className="mb-8 rounded-lg border border-border bg-muted/30 p-5">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Contenido
      </p>
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {TOC_ITEMS.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className="text-sm text-primary hover:underline">
              {label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-20">
      <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-4 text-sm font-semibold text-foreground">{children}</h3>;
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="ml-1 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="ml-1 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <b>Nota:</b> {children}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60 align-top">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
