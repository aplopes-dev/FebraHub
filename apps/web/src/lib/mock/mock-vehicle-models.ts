import { NextResponse } from "next/server";
import type {
  CreateVehicleModelPayload,
  VehicleModelDto,
} from "@/features/vehicle-models/api/vehicle-model.dto";

const SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const VALID_TYPES = new Set(["CAR", "MOTORCYCLE", "TRUCK", "VAN"]);
const VALID_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

let mockVehicleModels: VehicleModelDto[] = [
  {
    id: "00000000-0000-4000-8000-000000000401",
    brand: "Chevrolet",
    model: "Celta",
    version: "23",
    year: 2023,
    type: "CAR",
    status: "ACTIVE",
    category: "PARTICULAR",
    fipeCode: "234",
    imageUrl: "https://picsum.photos/seed/chevrolet-celta/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "00000000-0000-4000-8000-000000000402",
    brand: "Fiat",
    model: "Toro Volcano",
    version: "Volcano",
    year: 2025,
    type: "TRUCK",
    status: "ACTIVE",
    category: "PARTICULAR",
    fipeCode: "001539-3",
    imageUrl: "https://picsum.photos/seed/fiat-toro/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "00000000-0000-4000-8000-000000000403",
    brand: "Toyota",
    model: "Corolla",
    version: "XEi",
    year: 2024,
    type: "CAR",
    status: "ACTIVE",
    category: "PARTICULAR",
    fipeCode: "002145-0",
    imageUrl: "https://picsum.photos/seed/toyota-corolla/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "00000000-0000-4000-8000-000000000404",
    brand: "Toyota",
    model: "Hilux",
    version: "SRV",
    year: 2023,
    type: "TRUCK",
    status: "ACTIVE",
    category: "PARTICULAR",
    fipeCode: "002891-4",
    imageUrl: "https://picsum.photos/seed/toyota-hilux/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "00000000-0000-4000-8000-000000000405",
    brand: "Honda",
    model: "Civic",
    version: null,
    year: 2022,
    type: "CAR",
    status: "ACTIVE",
    category: "PARTICULAR",
    fipeCode: "001045-2",
    imageUrl: "https://picsum.photos/seed/honda-civic/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "00000000-0000-4000-8000-000000000406",
    brand: "Honda",
    model: "CB 500",
    version: "F",
    year: 2024,
    type: "MOTORCYCLE",
    status: "ACTIVE",
    category: "PARTICULAR",
    fipeCode: "811120-1",
    imageUrl: "https://picsum.photos/seed/honda-cb500/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "00000000-0000-4000-8000-000000000407",
    brand: "Mercedes-Benz",
    model: "Sprinter",
    version: "415",
    year: 2021,
    type: "VAN",
    status: "INACTIVE",
    category: "PARTICULAR",
    fipeCode: "003812-6",
    imageUrl: "https://picsum.photos/seed/mercedes-sprinter/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "00000000-0000-4000-8000-000000000408",
    brand: "Fiat",
    model: "Ducato",
    version: null,
    year: 2020,
    type: "VAN",
    status: "ACTIVE",
    category: "PARTICULAR",
    fipeCode: "001672-8",
    imageUrl: "https://picsum.photos/seed/fiat-ducato/480/240",
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

let nextModelSeq = 500;

function mockError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function normalizeType(value: unknown): string | null {
  if (typeof value !== "string" || !VALID_TYPES.has(value)) return null;
  return value;
}

function normalizeStatus(value: unknown): string | null {
  if (typeof value !== "string" || !VALID_STATUSES.has(value)) return null;
  return value;
}

function parseOptionalYear(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(num) || num < 1900 || num > 2100) return null;
  return num;
}

function isStatusOnlyPatch(body: Record<string, unknown>): boolean {
  const keys = Object.keys(body);
  return keys.length === 1 && keys[0] === "status";
}

export function handleMockVehicleModelsRequest(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText?: string | null,
): NextResponse | null {
  if (segments[0] !== "vehicle-models") {
    return null;
  }

  const id = segments[1];

  if (method === "GET" && !id) {
    const statusFilter = searchParams.get("status")?.trim().toUpperCase();
    let items = [...mockVehicleModels];
    if (statusFilter && VALID_STATUSES.has(statusFilter)) {
      items = items.filter((item) => item.status === statusFilter);
    }
    return NextResponse.json({ items });
  }

  if (method === "GET" && id) {
    const model = mockVehicleModels.find((item) => item.id === id);
    if (!model) {
      return mockError(404, "NotFoundError", "Modelo não encontrado.");
    }
    return NextResponse.json(model);
  }

  if (method === "POST" && !id) {
    try {
      const payload = JSON.parse(bodyText ?? "{}") as CreateVehicleModelPayload;
      const brand = typeof payload.brand === "string" ? payload.brand.trim() : "";
      const modelName =
        typeof payload.model === "string" ? payload.model.trim() : "";
      const type = normalizeType(payload.type);
      if (!brand || !modelName || !type) {
        return mockError(400, "ValidationError", "Marca, modelo e tipo são obrigatórios.");
      }
      const version =
        typeof payload.version === "string" && payload.version.trim()
          ? payload.version.trim()
          : null;
      const year = parseOptionalYear(payload.year);
      if (
        payload.year !== undefined &&
        payload.year !== null &&
        year === null
      ) {
        return mockError(400, "ValidationError", "Ano inválido.");
      }

      const created: VehicleModelDto = {
        id: `00000000-0000-4000-8000-000000000${String(nextModelSeq++).padStart(3, "0")}`,
        brand,
        model: modelName,
        version,
        year,
        type,
        status: "ACTIVE",
        category: "PARTICULAR",
        fipeCode: null,
        imageUrl:
          typeof payload.imageUrl === "string" && payload.imageUrl.trim()
            ? payload.imageUrl.trim()
            : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockVehicleModels.push(created);
      return NextResponse.json(created, { status: 201 });
    } catch {
      return mockError(400, "ValidationError", "Payload inválido.");
    }
  }

  if ((method === "PATCH" || method === "PUT") && id) {
    const index = mockVehicleModels.findIndex((item) => item.id === id);
    if (index === -1) {
      return mockError(404, "NotFoundError", "Modelo não encontrado.");
    }

    try {
      const body = JSON.parse(bodyText ?? "{}") as Record<string, unknown>;

      if (isStatusOnlyPatch(body)) {
        const status = normalizeStatus(body.status);
        if (!status) {
          return mockError(400, "ValidationError", "Status inválido.");
        }
        mockVehicleModels[index] = {
          ...mockVehicleModels[index],
          status,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json(mockVehicleModels[index]);
      }

      const current = mockVehicleModels[index];
      const brand =
        typeof body.brand === "string" ? body.brand.trim() : current.brand;
      const modelName =
        typeof body.model === "string" ? body.model.trim() : current.model;
      if (!brand || !modelName) {
        return mockError(400, "ValidationError", "Marca e modelo são obrigatórios.");
      }

      const type =
        body.type !== undefined ? normalizeType(body.type) : current.type;
      if (!type) {
        return mockError(400, "ValidationError", "Tipo inválido.");
      }

      let version: string | null = current.version;
      if (body.version !== undefined) {
        version =
          typeof body.version === "string" && body.version.trim()
            ? body.version.trim()
            : null;
      }

      let year: number | null = current.year;
      if (body.year !== undefined) {
        year = parseOptionalYear(body.year);
        if (body.year !== null && body.year !== "" && year === null) {
          return mockError(400, "ValidationError", "Ano inválido.");
        }
      }

      let imageUrl = current.imageUrl ?? null;
      if (body.imageUrl !== undefined) {
        imageUrl =
          typeof body.imageUrl === "string" && body.imageUrl.trim()
            ? body.imageUrl.trim()
            : null;
      }

      mockVehicleModels[index] = {
        ...current,
        brand,
        model: modelName,
        version,
        year,
        type,
        imageUrl,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json(mockVehicleModels[index]);
    } catch {
      return mockError(400, "ValidationError", "Payload inválido.");
    }
  }

  if (method !== "GET" && method !== "HEAD") {
    return mockError(405, "MethodNotAllowed", "Método não permitido.");
  }

  return null;
}
