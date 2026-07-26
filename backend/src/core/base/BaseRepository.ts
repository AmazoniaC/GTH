/**
 * Contrato base del patrón Repository. Cada repositorio concreto
 * encapsula el acceso a datos de una entidad, aislando la capa de
 * servicios de los detalles de Prisma. Facilita el cumplimiento del
 * principio de Inversión de Dependencias (SOLID).
 */
export interface IBaseRepository<T, CreateInput, UpdateInput> {
  findMany(args?: unknown): Promise<T[]>;
  findById(id: string, organizationId: string): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
  count(where?: unknown): Promise<number>;
}
