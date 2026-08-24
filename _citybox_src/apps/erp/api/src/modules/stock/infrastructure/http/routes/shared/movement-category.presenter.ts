import type { MovementCategory } from '../../../../domain/entities/movement-category.entity';
import type {
  ListMovementCategoriesResult,
  MovementCategoryOption,
} from '../../../../application/dtos/movement-category.dto';

export class MovementCategoryPresenter {
  static toHttp(category: MovementCategory) {
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      type: category.type,
      systemKey: category.systemKey,
      isSystem: category.isSystem,
      branchIds: category.branchIds,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(category: MovementCategory) {
    return { data: this.toHttp(category) };
  }

  static toHttpList(result: ListMovementCategoriesResult) {
    return {
      data: result.items.map((category) => this.toHttp(category)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpOptions(options: MovementCategoryOption[]) {
    return { data: options };
  }
}
