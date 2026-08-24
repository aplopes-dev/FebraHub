import type { VariationDto } from "@/features/variations/api/variation.dto";
import type {
  Variation,
  VariationFormValues,
  VariationOption,
} from "@/features/variations/types/variation";

export function centsToReais(cents: number): number {
  return Math.round(cents) / 100;
}

export function reaisToCents(reais: number): number {
  return Math.max(0, Math.round(reais * 100));
}

export function toVariationOption(
  dto: VariationDto["options"][number],
): VariationOption {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    imageUrl: dto.imageUrl,
    price: centsToReais(dto.priceCents),
    code: dto.code,
    sortOrder: dto.sortOrder,
  };
}

export function toVariation(dto: VariationDto): Variation {
  return {
    id: dto.id,
    name: dto.name,
    productName: dto.productName,
    calculation: { ...dto.calculation },
    options: dto.options
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toVariationOption),
  };
}

export function formValuesToSavePayload(
  values: VariationFormValues,
): {
  name: string;
  calculation: VariationFormValues["calculation"];
  options: Array<{
    id?: string;
    name: string;
    description: string;
    imageUrl: string | null;
    priceCents: number;
    code: string;
    sortOrder: number;
  }>;
} {
  return {
    name: values.name.trim(),
    calculation: { ...values.calculation },
    options: values.options
      .filter((option) => option.name.trim().length > 0)
      .map((option, index) => ({
        ...(option.id && !option.id.startsWith("opt-")
          ? { id: option.id }
          : {}),
        name: option.name.trim(),
        description: option.description.trim(),
        imageUrl:
          option.pendingImageFile || option.imageUrl?.startsWith("blob:")
            ? null
            : option.imageUrl,
        priceCents: reaisToCents(option.price),
        code: option.code.trim(),
        sortOrder: index,
      })),
  };
}
