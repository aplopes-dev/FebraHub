import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreSettingsEntity } from '../../../domain/entities/store-settings.entity';
import { StoreSettingsRepository } from '../../../domain/repositories/store-settings.repository.interface';

export interface UpdateStoreSettingsInput {
  storeId: string;
  name?: string;
  themeId?: string;
  cnpj?: string | null;
  communicationsName?: string | null;
  responsible?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

function normalizeOptional(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeDigits(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length > 0 ? digits : null;
}

@Injectable()
export class UpdateStoreSettingsUseCase implements IUseCase<
  UpdateStoreSettingsInput,
  StoreSettingsEntity
> {
  constructor(private readonly repository: StoreSettingsRepository) {}

  async execute(input: UpdateStoreSettingsInput): Promise<StoreSettingsEntity> {
    const settings = await this.repository.getOrCreateDefault(input.storeId);
    settings.update({
      name: input.name?.trim(),
      themeId: input.themeId?.trim(),
      cnpj: normalizeDigits(input.cnpj),
      communicationsName: normalizeOptional(input.communicationsName),
      responsible: normalizeOptional(input.responsible),
      email: normalizeOptional(input.email),
      phone: normalizeDigits(input.phone),
      mobile: normalizeDigits(input.mobile),
      cep: normalizeDigits(input.cep),
      street: normalizeOptional(input.street),
      number: normalizeOptional(input.number),
      complement: normalizeOptional(input.complement),
      neighborhood: normalizeOptional(input.neighborhood),
      city: normalizeOptional(input.city),
      state:
        input.state === undefined
          ? undefined
          : input.state?.trim()
            ? input.state.trim().toUpperCase()
            : null,
    });
    await this.repository.save(settings);
    return settings;
  }
}
