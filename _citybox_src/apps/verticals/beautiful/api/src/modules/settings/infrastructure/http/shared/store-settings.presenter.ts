import { StoreSettingsEntity } from '../../../domain/entities/store-settings.entity';

export interface StoreSettingsResponse {
  id: string;
  name: string;
  themeId: string;
  cnpj: string | null;
  communicationsName: string | null;
  responsible: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export class StoreSettingsPresenter {
  static toHTTP(entity: StoreSettingsEntity): StoreSettingsResponse {
    return {
      id: entity.id,
      name: entity.name,
      themeId: entity.themeId,
      cnpj: entity.cnpj,
      communicationsName: entity.communicationsName,
      responsible: entity.responsible,
      email: entity.email,
      phone: entity.phone,
      mobile: entity.mobile,
      cep: entity.cep,
      street: entity.street,
      number: entity.number,
      complement: entity.complement,
      neighborhood: entity.neighborhood,
      city: entity.city,
      state: entity.state,
      logoUrl: entity.hasLogo() ? 'v1/settings/store/logo' : null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
