import type { ProductAddonSettingsProps } from '../../../../domain/entities/product.entity';
import type { ProductAddonSettingsDto } from './product.dto';

/**
 * Preenche os defaults dos campos opcionais do DTO HTTP antes de repassar ao
 * use case — a entidade exige o objeto completo (`ProductAddonSettingsProps`),
 * o form pode mandar só os campos que o usuário mexeu.
 */
export function toAddonSettingsInput(
  dto: ProductAddonSettingsDto | undefined,
): ProductAddonSettingsProps | undefined {
  if (!dto) return undefined;
  return {
    minQuantity: dto.minQuantity ?? 0,
    maxQuantity: dto.maxQuantity ?? 0,
    chargeFromSelectedQuantity: dto.chargeFromSelectedQuantity ?? false,
    chargeFromQuantity: dto.chargeFromQuantity ?? 1,
  };
}
