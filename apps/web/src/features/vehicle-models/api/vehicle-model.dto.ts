export type VehicleModelDto = {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  year: number | null;
  type: string;
  status: string;
  category?: string | null;
  fipeCode?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListVehicleModelsResponseDto = {
  items: VehicleModelDto[];
};

export type CreateVehicleModelPayload = {
  brand: string;
  model: string;
  version?: string;
  year?: number | null;
  type: string;
  imageUrl?: string | null;
};

export type UpdateVehicleModelPayload = {
  brand?: string;
  model?: string;
  version?: string | null;
  year?: number | null;
  type?: string;
  imageUrl?: string | null;
};

export type ChangeVehicleModelStatusPayload = {
  status: string;
};
