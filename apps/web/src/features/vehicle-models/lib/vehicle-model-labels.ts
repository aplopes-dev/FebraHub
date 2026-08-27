import type {
  VehicleModelStatus,
  VehicleModelType,
} from "@/features/vehicle-models/types/vehicle-model";

const VEHICLE_MODEL_TYPES: Record<VehicleModelType, string> = {
  CAR: "Carro",
  MOTORCYCLE: "Moto",
  TRUCK: "Caminhão",
  VAN: "Van",
};

const VEHICLE_MODEL_STATUSES: Record<VehicleModelStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export function vehicleModelTypeLabel(type: string): string {
  return VEHICLE_MODEL_TYPES[type as VehicleModelType] ?? type;
}

export function vehicleModelStatusLabel(status: string): string {
  return VEHICLE_MODEL_STATUSES[status as VehicleModelStatus] ?? status;
}

/** Label curta para badge no card (ex.: AUTOMOVEL). */
export function vehicleModelTypeBadgeLabel(type: string): string {
  switch (type) {
    case "CAR":
      return "AUTOMOVEL";
    case "MOTORCYCLE":
      return "MOTOCICLETA";
    case "TRUCK":
      return "CAMINHONETE";
    case "VAN":
      return "VAN";
    default:
      return type;
  }
}

export const VEHICLE_TYPE_OPTIONS = Object.entries(VEHICLE_MODEL_TYPES).map(
  ([value, label]) => ({
    value: value as VehicleModelType,
    label,
  }),
);

export const VEHICLE_STATUS_FILTER_OPTIONS: {
  value: "" | VehicleModelStatus;
  label: string;
}[] = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
];
