import type { ClinicStoreProfile } from '../../../../domain/entities/clinic-store-profile.entity';

export type ClinicProfileResponse = {
  clinicName: string;
  cnpj: string;
  communicationsName: string;
  responsible: string;
  logoUrl: string | null;
  openingTime: string;
  closingTime: string;
  email: string;
  phone: string;
  mobile: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export function toClinicProfileResponse(
  profile: ClinicStoreProfile,
): ClinicProfileResponse {
  return {
    clinicName: profile.clinicName,
    cnpj: profile.cnpj,
    communicationsName: profile.communicationsName,
    responsible: profile.responsible,
    logoUrl: profile.hasLogo() ? 'v1/clinic-profile/logo' : null,
    openingTime: profile.openingTime,
    closingTime: profile.closingTime,
    email: profile.email,
    phone: profile.phone,
    mobile: profile.mobile,
    cep: profile.cep,
    street: profile.street,
    number: profile.number,
    complement: profile.complement,
    neighborhood: profile.neighborhood,
    city: profile.city,
    state: profile.state,
  };
}
