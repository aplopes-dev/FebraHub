import type { UpdateClinicStoreProfileInput } from '../../domain/entities/clinic-store-profile.entity';

export type GetClinicProfileDto = {
  storeId: string;
};

export type UpsertClinicProfileDto = {
  storeId: string;
} & UpdateClinicStoreProfileInput;

export type UploadClinicLogoDto = {
  storeId: string;
  buffer: Buffer;
  declaredMimeType: string;
};

export type DeleteClinicLogoDto = {
  storeId: string;
};

export type GetClinicLogoDto = {
  storeId: string;
};
