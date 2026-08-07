import rateLimit from 'express-rate-limit';

/**
 * Limitadores de tasa de peticiones.
 *
 * Protegen la API frente a abusos y fuerza bruta. El limitador de
 * autenticación es estricto (evita adivinar contraseñas), mientras que el
 * general deja un margen amplio para el uso normal de la aplicación.
 */

/** Endpoints de autenticación: pocos intentos por ventana e IP. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10, // 10 intentos por IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Demasiados intentos de acceso. Espera unos minutos e inténtalo de nuevo.',
  },
});

/** Límite general para toda la API (protección básica ante ráfagas). */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  limit: 300, // 300 peticiones por IP y minuto
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.' },
});
