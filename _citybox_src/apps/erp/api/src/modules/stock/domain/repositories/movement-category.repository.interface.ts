import type {
  MovementCategory,
  MovementCategoryType,
} from '../entities/movement-category.entity';

export type MovementCategoryListCriteria = {
  search?: string;
  type?: MovementCategoryType;
  skip?: number;
  take?: number;
};

export abstract class MovementCategoryRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<MovementCategory | null>;

  abstract findAll(
    organizationId: string,
    criteria?: MovementCategoryListCriteria,
  ): Promise<MovementCategory[]>;

  abstract count(
    organizationId: string,
    criteria?: { search?: string; type?: MovementCategoryType },
  ): Promise<number>;

  /**
   * Próximo código `CM-NNN` da organização (max numérico + 1, pad 3).
   */
  abstract nextCode(organizationId: string): Promise<string>;

  /**
   * Grava a categoria **e** os vínculos com as unidades na mesma operação
   * (substitui `MovementCategoryBranch`).
   */
  abstract save(category: MovementCategory): Promise<MovementCategory>;

  /**
   * A categoria já foi usada em alguma movimentação?
   *
   * `StockMovement.category` é `onDelete: Restrict`, então excluir uma
   * categoria referenciada estoura FK (`P2003`) — e o `AppExceptionFilter` é
   * `@Catch(AppError)`, ou seja, o erro do Prisma escapa como 500. Checar
   * antes converte isso no 409 que a rota já documenta.
   */
  abstract isInUse(organizationId: string, id: string): Promise<boolean>;

  abstract delete(organizationId: string, id: string): Promise<void>;
}
