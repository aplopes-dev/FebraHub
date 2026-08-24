import type {
  VariationPriceMethod,
  VariationCalculationConfig,
} from "@/features/variations/types/variation";

export const DEFAULT_VARIATION_CALCULATION: VariationCalculationConfig = {
  chooseFrom: 1,
  chooseTo: 1,
  chargeFromSelectedQuantity: false,
  chargeFromQuantity: 1,
  priceMethod: "sum",
};

export const VARIATION_PRICE_METHOD_OPTIONS: Array<{
  value: VariationPriceMethod;
  label: string;
  description: string;
}> = [
  {
    value: "sum",
    label: "Soma total",
    description:
      "Cliente é cobrado pelo preço do produto + soma das opções que escolher",
  },
  {
    value: "average",
    label: "Média",
    description:
      "Cliente é cobrado pelo preço do produto + média dos preços das opções que escolher",
  },
  {
    value: "highest",
    label: "Maior preço",
    description:
      "Cliente é cobrado pelo preço do produto + o maior preço entre as opções que escolher",
  },
];

export function getVariationPriceMethodDescription(
  method: VariationPriceMethod,
): string {
  return (
    VARIATION_PRICE_METHOD_OPTIONS.find((option) => option.value === method)
      ?.description ?? ""
  );
}
