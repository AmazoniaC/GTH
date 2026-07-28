/**
 * Cálculo de festivos de Colombia y conteo de días hábiles.
 *
 * Los festivos se calculan de forma automática (incluyendo la Ley Emiliani,
 * que traslada varios festivos al lunes siguiente) para cualquier año, sin
 * depender de tablas fijas.
 */

const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Domingo de Pascua (algoritmo de Meeus/Butcher). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Traslada una fecha al lunes siguiente (Ley Emiliani), si no es lunes. */
function nextMonday(date: Date): Date {
  const day = date.getUTCDay(); // 0=domingo, 1=lunes...
  const add = day === 1 ? 0 : (8 - day) % 7;
  return new Date(date.getTime() + add * 86_400_000);
}

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

/** Devuelve el conjunto de festivos (YYYY-MM-DD) de Colombia para un año. */
export function colombianHolidays(year: number): Set<string> {
  const fixed: [number, number][] = [
    [1, 1], // Año nuevo
    [5, 1], // Día del trabajo
    [7, 20], // Independencia
    [8, 7], // Batalla de Boyacá
    [12, 8], // Inmaculada Concepción
    [12, 25], // Navidad
  ];
  // Festivos que se trasladan al lunes siguiente (Ley Emiliani).
  const emiliani: [number, number][] = [
    [1, 6], // Reyes Magos
    [3, 19], // San José
    [6, 29], // San Pedro y San Pablo
    [8, 15], // Asunción de la Virgen
    [10, 12], // Día de la Raza
    [11, 1], // Todos los Santos
    [11, 11], // Independencia de Cartagena
  ];

  const set = new Set<string>();
  for (const [m, d] of fixed) set.add(key(year, m, d));
  for (const [m, d] of emiliani) {
    const moved = nextMonday(new Date(Date.UTC(year, m - 1, d)));
    set.add(key(moved.getUTCFullYear(), moved.getUTCMonth() + 1, moved.getUTCDate()));
  }

  // Festivos móviles basados en Pascua.
  const easter = easterSunday(year);
  const easterBased: [Date, boolean][] = [
    [addDays(easter, -3), false], // Jueves Santo (no se traslada)
    [addDays(easter, -2), false], // Viernes Santo (no se traslada)
    [addDays(easter, 43), true], // Ascensión del Señor (+ lunes)
    [addDays(easter, 64), true], // Corpus Christi (+ lunes)
    [addDays(easter, 71), true], // Sagrado Corazón (+ lunes)
  ];
  for (const [date, moves] of easterBased) {
    const d = moves ? nextMonday(date) : date;
    set.add(key(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()));
  }

  return set;
}

// Caché de festivos por año (evita recalcular).
const holidayCache = new Map<number, Set<string>>();
function holidaysFor(year: number): Set<string> {
  let set = holidayCache.get(year);
  if (!set) {
    set = colombianHolidays(year);
    holidayCache.set(year, set);
  }
  return set;
}

function isHoliday(date: Date): boolean {
  const y = date.getUTCFullYear();
  return holidaysFor(y).has(key(y, date.getUTCMonth() + 1, date.getUTCDate()));
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Convierte una fecha a UTC-medianoche (para iterar por días sin desfases). */
function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Cuenta días calendario inclusivos entre dos fechas. */
export function countCalendarDays(start: Date, end: Date): number {
  const s = toUtcMidnight(start).getTime();
  const e = toUtcMidnight(end).getTime();
  if (e < s) return 0;
  return Math.floor((e - s) / 86_400_000) + 1;
}

/** Cuenta días hábiles inclusivos (excluye fines de semana y festivos CO). */
export function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  let cursor = toUtcMidnight(start);
  const last = toUtcMidnight(end);
  while (cursor.getTime() <= last.getTime()) {
    if (!isWeekend(cursor) && !isHoliday(cursor)) count += 1;
    cursor = addDays(cursor, 1);
  }
  return count;
}

/**
 * Cuenta cuántos días de un rango [start, end] caen dentro del período
 * [periodStart, periodEnd], según el modo (hábiles o calendario). Sirve para
 * reflejar en la nómina del mes solo la parte de la ausencia que corresponde.
 */
export function countDaysInPeriod(
  start: Date,
  end: Date,
  periodStart: Date,
  periodEnd: Date,
  mode: 'BUSINESS' | 'CALENDAR',
): number {
  const s = Math.max(toUtcMidnight(start).getTime(), toUtcMidnight(periodStart).getTime());
  const e = Math.min(toUtcMidnight(end).getTime(), toUtcMidnight(periodEnd).getTime());
  if (e < s) return 0;
  const from = new Date(s);
  const to = new Date(e);
  return mode === 'BUSINESS' ? countBusinessDays(from, to) : countCalendarDays(from, to);
}
