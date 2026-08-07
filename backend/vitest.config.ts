import { defineConfig } from 'vitest/config';

/**
 * Configuración de pruebas del backend.
 *
 * Las pruebas viven en `tests/` (fuera de `src/`) para no incluirse en el
 * build de producción. Cubren las funciones puras del motor de cálculo:
 * nómina, liquidaciones, fechas colombianas, novedades y reglas de ausencias.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
