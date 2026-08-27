import type {
  SaveStockPayload,
  StockDto,
} from "@/features/stock/api/stock.dto";
import type {
  Stock,
  StockFormValues,
} from "@/features/stock/types/stock";

export function toStock(dto: StockDto): Stock {
  return {
    id: dto.id,
    name: dto.name,
    location: dto.location,
    property: dto.property,
    unitIds: [...dto.branchIds],
    isDefault: dto.isDefault,
    hasMovements: dto.hasMovements,
  };
}

export function toSaveStockPayload(values: StockFormValues): SaveStockPayload {
  return {
    name: values.name.trim(),
    location: values.location,
    property: values.property,
    branchIds: [...values.unitIds],
  };
}

export function stockToFormValues(stock: Stock): StockFormValues {
  return {
    name: stock.name,
    location: stock.location,
    property: stock.property,
    unitIds: [...stock.unitIds],
  };
}

export function createEmptyStockFormValues(): StockFormValues {
  return {
    name: "",
    location: "proprio",
    property: "proprio",
    unitIds: [],
  };
}
