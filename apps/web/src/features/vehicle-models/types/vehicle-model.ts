export type VehicleModelType = "CAR" | "MOTORCYCLE" | "TRUCK" | "VAN";

export type VehicleModelStatus = "ACTIVE" | "INACTIVE";

export type VehicleModel = {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  year: number | null;
  type: VehicleModelType;
  status: VehicleModelStatus;
  /** Categoria de uso (mock / futuro cadastro). */
  category: string | null;
  /** Código FIPE (mock / futuro cadastro). */
  fipeCode: string | null;
  /** Path ou URL da imagem do modelo (mock até API expor upload). */
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleModelFormValues = {
  brand: string;
  model: string;
  version: string;
  year: string;
  type: VehicleModelType;
  /** Preview local (blob:) ou URL persistida. */
  imagePreviewUrl: string | null;
  /** Arquivo escolhido e ainda não enviado à API. */
  imageFile: File | null;
};

export type VehicleModelStatusFilter = "" | VehicleModelStatus;

export type VehicleModelListParams = {
  status?: VehicleModelStatus;
};
