import {
  centsToReais,
  reaisToCents,
} from "@/features/products/api/product.mapper";
import type {
  PriceList,
  PriceListFormValues,
  PriceListItemPrice,
} from "@/features/price-lists/types/price-list";
import type {
  PriceListDto,
  PriceListItemDto,
  SavePriceListPayload,
} from "./price-list.dto";

/** API → UI: fixed_over_base vem em centavos; demais tipos em %. */
export function toPriceList(dto: PriceListDto): PriceList {
  return {
    id: dto.id,
    name: dto.name,
    adjustmentType: dto.adjustmentType,
    adjustmentValue:
      dto.adjustmentType === "fixed_over_base"
        ? centsToReais(dto.adjustmentValue)
        : dto.adjustmentValue,
    channels: [...dto.channels],
    branchIds: [...(dto.branchIds ?? [])],
    startDate: dto.startDate,
    endDate: dto.endDate,
    active: dto.active,
    priority: dto.priority,
    productCount: dto.productCount,
  };
}

export function toPriceListItem(dto: PriceListItemDto): PriceListItemPrice {
  return {
    productId: dto.productId,
    price: centsToReais(dto.priceCents),
  };
}

export function priceListToFormValues(list: PriceList): PriceListFormValues {
  return {
    name: list.name,
    adjustmentType: list.adjustmentType,
    adjustmentValue: list.adjustmentValue,
    channels: [...list.channels],
    branchIds: [...list.branchIds],
    startDate: list.startDate,
    endDate: list.endDate,
    active: list.active,
  };
}

/** UI → API: fixed_over_base em centavos; manual zera o valor. */
export function toSavePriceListPayload(
  values: PriceListFormValues,
): SavePriceListPayload {
  const adjustmentType = values.adjustmentType;
  const rawValue =
    adjustmentType === "manual" ? 0 : Math.max(0, values.adjustmentValue);

  return {
    name: values.name.trim(),
    adjustmentType,
    adjustmentValue:
      adjustmentType === "fixed_over_base" ? reaisToCents(rawValue) : rawValue,
    channels: [...values.channels],
    branchIds: [...values.branchIds],
    startDate: values.startDate,
    endDate: values.endDate,
    active: values.active,
  };
}

export function toReplaceItemsPayload(items: PriceListItemPrice[]) {
  return {
    items: items.map((item) => ({
      productId: item.productId,
      priceCents: reaisToCents(item.price),
    })),
  };
}
