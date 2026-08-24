import {
  VARIATION_PRICE_METHODS,
  type VariationCalculationProps,
  type VariationOptionInput,
  type VariationOptionProps,
  normalizeVariationOptions,
} from '../../domain/entities/variation.entity';
import { VariationInvalidError } from '../../domain/errors/variation-invalid.error';

export function parseVariationPayload(input: {
  name: string;
  calculation: VariationCalculationProps;
  options: VariationOptionInput[];
}): {
  name: string;
  calculation: VariationCalculationProps;
  options: VariationOptionProps[];
} {
  const name = input.name.trim();
  if (!name) {
    throw new VariationInvalidError('Nome da variação é obrigatório');
  }

  const chooseFrom = Math.trunc(input.calculation.chooseFrom);
  const chooseTo = Math.trunc(input.calculation.chooseTo);
  const chargeFromQuantity = Math.trunc(input.calculation.chargeFromQuantity);

  if (chooseFrom < 0 || chooseTo < chooseFrom) {
    throw new VariationInvalidError(
      'Quantidade de escolhas inválida (mínimo não pode ser maior que o máximo)',
    );
  }

  if (chargeFromQuantity < 0) {
    throw new VariationInvalidError(
      'Quantidade a partir da qual cobrar deve ser zero ou positiva',
    );
  }

  if (!VARIATION_PRICE_METHODS.includes(input.calculation.priceMethod)) {
    throw new VariationInvalidError('Método de preço inválido');
  }

  const options = normalizeVariationOptions(input.options).filter(
    (option) => option.name.length > 0,
  );

  if (options.length === 0) {
    throw new VariationInvalidError('Informe ao menos uma opção com nome');
  }

  return {
    name,
    calculation: {
      chooseFrom,
      chooseTo,
      chargeFromSelectedQuantity: Boolean(
        input.calculation.chargeFromSelectedQuantity,
      ),
      chargeFromQuantity,
      priceMethod: input.calculation.priceMethod,
    },
    options,
  };
}
