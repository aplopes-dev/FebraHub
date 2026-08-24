import { SalesLabel } from '../../domain/entities/sales-label.entity';

export class SalesLabelEntityMapper {
  static toDomain(row: {
    id: string;
    storeId: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  }): SalesLabel {
    return SalesLabel.with(
      {
        storeId: row.storeId,
        name: row.name,
        color: row.color,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
