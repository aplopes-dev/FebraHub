import type { VehicleModelDto } from "@/features/vehicle-models/api/vehicle-model.dto";
import type {
  VehicleModel,
  VehicleModelFormValues,
  VehicleModelStatus,
  VehicleModelType,
} from "@/features/vehicle-models/types/vehicle-model";

function parseVehicleModelType(value: string): VehicleModelType {
  if (
    value === "CAR" ||
    value === "MOTORCYCLE" ||
    value === "TRUCK" ||
    value === "VAN"
  ) {
    return value;
  }
  return "CAR";
}

function parseVehicleModelStatus(value: string): VehicleModelStatus {
  return value === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

export function toVehicleModel(dto: VehicleModelDto): VehicleModel {
  return {
    id: dto.id,
    brand: dto.brand,
    model: dto.model,
    version: dto.version,
    year: dto.year,
    type: parseVehicleModelType(dto.type),
    status: parseVehicleModelStatus(dto.status),
    category: dto.category ?? null,
    fipeCode: dto.fipeCode ?? null,
    imageUrl: dto.imageUrl ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function createEmptyVehicleModelFormValues(): VehicleModelFormValues {
  return {
    brand: "",
    model: "",
    version: "",
    year: "",
    type: "CAR",
    imagePreviewUrl: null,
    imageFile: null,
  };
}

export function vehicleModelToFormValues(
  model: VehicleModel,
): VehicleModelFormValues {
  return {
    brand: model.brand,
    model: model.model,
    version: model.version ?? "",
    year: model.year != null ? String(model.year) : "",
    type: model.type,
    imagePreviewUrl: model.imageUrl,
    imageFile: null,
  };
}

function resolveImageUrl(values: VehicleModelFormValues): string | null {
  return values.imagePreviewUrl?.trim() || null;
}

export function formValuesToCreatePayload(
  values: VehicleModelFormValues,
): {
  brand: string;
  model: string;
  version?: string;
  year?: number | null;
  type: string;
  imageUrl: string | null;
} {
  const yearTrimmed = values.year.trim();
  const year =
    yearTrimmed.length > 0 ? Number.parseInt(yearTrimmed, 10) : null;
  const versionTrimmed = values.version.trim();

  return {
    brand: values.brand.trim(),
    model: values.model.trim(),
    type: values.type,
    version: versionTrimmed.length > 0 ? versionTrimmed : undefined,
    year: Number.isFinite(year) ? year : null,
    imageUrl: resolveImageUrl(values),
  };
}

export function formValuesToUpdatePayload(
  values: VehicleModelFormValues,
): {
  brand: string;
  model: string;
  version: string | null;
  year: number | null;
  type: string;
  imageUrl: string | null;
} {
  const payload = formValuesToCreatePayload(values);
  return {
    brand: payload.brand,
    model: payload.model,
    type: payload.type,
    version: payload.version ?? null,
    year: payload.year ?? null,
    imageUrl: payload.imageUrl,
  };
}
