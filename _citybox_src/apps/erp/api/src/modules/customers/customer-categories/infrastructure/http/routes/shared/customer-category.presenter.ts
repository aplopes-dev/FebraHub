import type { CustomerCategory } from '../../../../domain/entities/customer-category.entity';
import type {
  CustomerCategoryListItem,
  ListCustomerCategoriesResult,
} from '../../../../application/dtos/customer-category.dto';

export class CustomerCategoryPresenter {
  static toHttp(item: CustomerCategoryListItem) {
    return {
      id: item.category.id,
      name: item.category.name,
      discountPercentage: item.category.discountPercentage,
      customerCount: item.customerCount,
      createdAt: item.category.createdAt.toISOString(),
      updatedAt: item.category.updatedAt.toISOString(),
    };
  }

  static toHttpFromCategory(category: CustomerCategory, customerCount = 0) {
    return this.toHttp({ category, customerCount });
  }

  static toHttpSingle(item: CustomerCategoryListItem) {
    return { data: this.toHttp(item) };
  }

  static toHttpList(result: ListCustomerCategoriesResult) {
    return {
      data: result.items.map((item) => this.toHttp(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
