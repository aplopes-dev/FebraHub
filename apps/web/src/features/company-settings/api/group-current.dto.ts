import type { UnitAddress } from "../types/address";

/** Resposta de `GET /v1/groups/current` (mock / futuro contrato). */
export type GroupCurrentDto = {
  id: string;
  legalName: string;
  tradeName: string | null;
  holdingDocument: string | null;
  email: string;
  phone: string | null;
  adminAddress: UnitAddress;
  timezone: string;
  hasLogo: boolean;
  imageUrl: string | null;
  unitsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GroupCurrentResponseDto = {
  data: GroupCurrentDto;
};

export type UpdateGroupCurrentPayload = {
  legalName: string;
  tradeName?: string;
  holdingDocument?: string;
  email: string;
  phone?: string;
  adminAddress: UnitAddress;
  timezone: string;
};
