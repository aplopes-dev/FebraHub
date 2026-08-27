import { NextResponse } from "next/server";
import type {
  BranchDto,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "@/features/branches/api/branch.dto";
import { DEFAULT_BRANCH_TIMEZONE } from "@/features/branches/types/branch";

/** Id fixo da matriz seed — alinhado ao tenancy do shell. */
export const MOCK_MATRIX_ID = "00000000-0000-4000-8000-000000000002";

/** @deprecated Use MOCK_MATRIX_ID */
export const MOCK_HEADQUARTERS_BRANCH_ID = MOCK_MATRIX_ID;

export const MOCK_STORE_ID = "00000000-0000-4000-8000-000000000003";

export const MOCK_STORE_NORTE_ID = "00000000-0000-4000-8000-000000000004";

export const MOCK_MATRIX_2_ID = "00000000-0000-4000-8000-000000000005";

export const MOCK_STORE_CAMPINAS_ID = "00000000-0000-4000-8000-000000000006";

const SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const SEED_MATRIX: BranchDto = {
  id: MOCK_MATRIX_ID,
  kind: "matrix",
  matrixId: null,
  code: "001",
  personType: "PJ",
  document: "00000000000191",
  legalName: "FebraHub Demonstração LTDA",
  tradeName: "FebraHub Demo",
  displayName: "FebraHub Demo",
  stateRegistration: null,
  municipalRegistration: null,
  taxRegime: "SIMPLES_NACIONAL",
  address: {
    zipCode: "01310-100",
    street: "Avenida Paulista",
    number: "1000",
    complement: null,
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  },
  phone: "1130000000",
  email: "contato@febrahub.local",
  timezone: DEFAULT_BRANCH_TIMEZONE,
  active: true,
  hasLogo: false,
  imageUrl: null,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

const SEED_STORE: BranchDto = {
  id: MOCK_STORE_ID,
  kind: "store",
  matrixId: MOCK_MATRIX_ID,
  code: "002",
  personType: "PJ",
  document: "00000000000272",
  legalName: "FebraHub Demonstração LTDA",
  tradeName: "Loja Centro",
  displayName: "Loja Centro",
  stateRegistration: null,
  municipalRegistration: null,
  taxRegime: "SIMPLES_NACIONAL",
  address: {
    zipCode: "01310-200",
    street: "Rua Augusta",
    number: "500",
    complement: null,
    neighborhood: "Consolação",
    city: "São Paulo",
    state: "SP",
  },
  phone: "1130000001",
  email: "loja@febrahub.local",
  timezone: DEFAULT_BRANCH_TIMEZONE,
  active: true,
  hasLogo: false,
  imageUrl: null,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

const SEED_STORE_NORTE: BranchDto = {
  id: MOCK_STORE_NORTE_ID,
  kind: "store",
  matrixId: MOCK_MATRIX_ID,
  code: "003",
  personType: "PJ",
  document: "00000000000353",
  legalName: "FebraHub Demonstração LTDA",
  tradeName: "Loja Norte",
  displayName: "Loja Norte",
  stateRegistration: null,
  municipalRegistration: null,
  taxRegime: "SIMPLES_NACIONAL",
  address: {
    zipCode: "02010-000",
    street: "Avenida Nova de Heliópolis",
    number: "200",
    complement: null,
    neighborhood: "Santana",
    city: "São Paulo",
    state: "SP",
  },
  phone: "1130000002",
  email: "norte@febrahub.local",
  timezone: DEFAULT_BRANCH_TIMEZONE,
  active: true,
  hasLogo: false,
  imageUrl: null,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

const SEED_MATRIX_2: BranchDto = {
  id: MOCK_MATRIX_2_ID,
  kind: "matrix",
  matrixId: null,
  code: "010",
  personType: "PJ",
  document: "00000000000434",
  legalName: "Auto Sul LTDA",
  tradeName: "Auto Sul",
  displayName: "Auto Sul LTDA",
  stateRegistration: null,
  municipalRegistration: null,
  taxRegime: "SIMPLES_NACIONAL",
  address: {
    zipCode: "13010-100",
    street: "Avenida Francisco Glicério",
    number: "800",
    complement: null,
    neighborhood: "Centro",
    city: "Campinas",
    state: "SP",
  },
  phone: "1930000000",
  email: "contato@autosul.local",
  timezone: DEFAULT_BRANCH_TIMEZONE,
  active: true,
  hasLogo: false,
  imageUrl: null,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

const SEED_STORE_CAMPINAS: BranchDto = {
  id: MOCK_STORE_CAMPINAS_ID,
  kind: "store",
  matrixId: MOCK_MATRIX_2_ID,
  code: "011",
  personType: "PJ",
  document: "00000000000515",
  legalName: "Auto Sul LTDA",
  tradeName: "Loja Campinas",
  displayName: "Loja Campinas",
  stateRegistration: null,
  municipalRegistration: null,
  taxRegime: "SIMPLES_NACIONAL",
  address: {
    zipCode: "13015-200",
    street: "Rua Barão de Jaguara",
    number: "300",
    complement: null,
    neighborhood: "Centro",
    city: "Campinas",
    state: "SP",
  },
  phone: "1930000001",
  email: "campinas@autosul.local",
  timezone: DEFAULT_BRANCH_TIMEZONE,
  active: true,
  hasLogo: false,
  imageUrl: null,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

/** Estado em memória — persiste só enquanto o servidor de dev estiver rodando. */
let mockUnits: BranchDto[] = [
  { ...SEED_MATRIX },
  { ...SEED_STORE },
  { ...SEED_STORE_NORTE },
  { ...SEED_MATRIX_2 },
  { ...SEED_STORE_CAMPINAS },
];

let mockGroupName = "Grupo Demonstração";

type UnitCountListener = (counts: { stores: number; total: number }) => void;
const unitCountListeners = new Set<UnitCountListener>();

export function onMockBranchCountChange(listener: UnitCountListener) {
  unitCountListeners.add(listener);
  listener(countActiveUnits());
  return () => unitCountListeners.delete(listener);
}

function countActiveUnits(): { stores: number; total: number } {
  const active = mockUnits.filter((unit) => unit.active);
  return {
    stores: active.filter((unit) => unit.kind === "store").length,
    total: active.length,
  };
}

function notifyUnitCountChange() {
  const counts = countActiveUnits();
  for (const listener of unitCountListeners) {
    listener(counts);
  }
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function resolveDisplayName(
  legalName: string,
  tradeName?: string | null,
): string {
  const trade = tradeName?.trim();
  return trade || legalName.trim();
}

function buildAddressFromPayload(
  payload: CreateBranchPayload | UpdateBranchPayload,
  existing?: BranchDto["address"],
): BranchDto["address"] {
  const hasAddressField =
    "zipCode" in payload ||
    "street" in payload ||
    "number" in payload ||
    "complement" in payload ||
    "neighborhood" in payload ||
    "city" in payload ||
    "state" in payload;

  if (!hasAddressField) {
    return existing ?? null;
  }

  return {
    zipCode: payload.zipCode?.trim() || existing?.zipCode || null,
    street: payload.street?.trim() || existing?.street || null,
    number: payload.number?.trim() || existing?.number || null,
    complement: payload.complement?.trim() || existing?.complement || null,
    neighborhood:
      payload.neighborhood?.trim() || existing?.neighborhood || null,
    city: payload.city?.trim() || existing?.city || null,
    state: payload.state?.trim() || existing?.state || null,
  };
}

function mockError(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function filterUnits(
  units: BranchDto[],
  searchParams: URLSearchParams,
  kind?: BranchDto["kind"],
): BranchDto[] {
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const activeOnly = searchParams.get("active") === "true";
  const includeInactive = searchParams.get("includeInactive") === "true";

  let filtered = [...units];

  if (kind) {
    filtered = filtered.filter((unit) => unit.kind === kind);
  }

  if (activeOnly || !includeInactive) {
    filtered = filtered.filter((unit) => unit.active);
  }

  if (search) {
    const searchDigits = digitsOnly(search);
    filtered = filtered.filter((unit) => {
      const haystack = [
        unit.code,
        unit.displayName,
        unit.legalName,
        unit.tradeName ?? "",
        unit.document,
        digitsOnly(unit.document),
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(search)) return true;
      return (
        searchDigits.length > 0 && digitsOnly(unit.document).includes(searchDigits)
      );
    });
  }

  return filtered;
}

export function listMockBranches(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const perPage = Math.max(
    1,
    Math.min(100, Number(searchParams.get("perPage") ?? 20) || 20),
  );

  const filtered = filterUnits(mockUnits, searchParams, "store");
  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  return {
    data,
    meta: { page: safePage, perPage, total, totalPages },
  };
}

export function listMockMatrices(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const perPage = Math.max(
    1,
    Math.min(100, Number(searchParams.get("perPage") ?? 20) || 20),
  );

  const filtered = filterUnits(mockUnits, searchParams, "matrix");
  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  return {
    data,
    meta: { page: safePage, perPage, total, totalPages },
  };
}

export function getMockOrganizationStructure() {
  const activeMatrices = mockUnits.filter(
    (unit) => unit.kind === "matrix" && unit.active,
  );
  const storesByMatrix: Record<string, BranchDto[]> = {};

  for (const matrix of activeMatrices) {
    storesByMatrix[matrix.id] = mockUnits.filter(
      (unit) =>
        unit.kind === "store" &&
        unit.active &&
        unit.matrixId === matrix.id,
    );
  }

  return {
    groupName: mockGroupName,
    matrices: activeMatrices,
    storesByMatrix,
  };
}

export function getMockUnit(id: string): BranchDto | undefined {
  return mockUnits.find((unit) => unit.id === id);
}

export function getMockStoreIdsByMatrix(): Record<string, string[]> {
  const structure = getMockOrganizationStructure();
  const result: Record<string, string[]> = {};
  for (const [matrixId, stores] of Object.entries(structure.storesByMatrix)) {
    result[matrixId] = stores.map((store) => store.id);
  }
  return result;
}

export function getMockMatrixIds(): string[] {
  return mockUnits
    .filter((unit) => unit.kind === "matrix" && unit.active)
    .map((unit) => unit.id);
}

/** @deprecated Use getMockUnit */
export const getMockBranch = getMockUnit;

function assertUniqueCode(code: string, excludeId?: string) {
  const normalized = code.trim().toLowerCase();
  const duplicate = mockUnits.find(
    (unit) =>
      unit.id !== excludeId &&
      unit.active &&
      unit.code.trim().toLowerCase() === normalized,
  );
  if (duplicate) {
    throw new MockUnitError(
      409,
      "DuplicateCodeError",
      "Já existe uma unidade com este código.",
    );
  }
}

function assertUniqueDocument(document: string, excludeId?: string) {
  const normalized = digitsOnly(document);
  const duplicate = mockUnits.find(
    (unit) =>
      unit.id !== excludeId &&
      unit.active &&
      digitsOnly(unit.document) === normalized,
  );
  if (duplicate) {
    throw new MockUnitError(
      409,
      "DuplicateDocumentError",
      "Já existe uma unidade com este CNPJ/CPF.",
    );
  }
}

class MockUnitError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = code;
  }
}

function createMockUnit(
  payload: CreateBranchPayload,
  kind: BranchDto["kind"],
): BranchDto {
  const code = payload.code.trim();
  const legalName = payload.legalName.trim();
  const document = payload.document.trim();

  if (!code) {
    throw new MockUnitError(400, "ValidationError", "Informe o código da unidade.");
  }
  if (!legalName) {
    throw new MockUnitError(400, "ValidationError", "Informe a razão social.");
  }
  if (!document) {
    throw new MockUnitError(400, "ValidationError", "Informe o documento da unidade.");
  }

  if (kind === "store") {
    const matrixId = payload.matrixId?.trim();
    if (!matrixId) {
      throw new MockUnitError(
        400,
        "ValidationError",
        "Informe a empresa matriz da loja.",
      );
    }
    const matrix = getMockUnit(matrixId);
    if (!matrix || matrix.kind !== "matrix" || !matrix.active) {
      throw new MockUnitError(
        404,
        "NotFoundError",
        "Empresa matriz não encontrada.",
      );
    }
  }

  assertUniqueCode(code);
  assertUniqueDocument(document);

  const now = new Date().toISOString();

  const unit: BranchDto = {
    id: crypto.randomUUID(),
    kind,
    matrixId: kind === "store" ? payload.matrixId!.trim() : null,
    code,
    personType: payload.personType,
    document,
    legalName,
    tradeName: payload.tradeName?.trim() || null,
    displayName: resolveDisplayName(legalName, payload.tradeName),
    stateRegistration: payload.stateRegistration?.trim() || null,
    municipalRegistration: payload.municipalRegistration?.trim() || null,
    taxRegime: payload.taxRegime ?? "SIMPLES_NACIONAL",
    address: buildAddressFromPayload(payload),
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    timezone: payload.timezone?.trim() || DEFAULT_BRANCH_TIMEZONE,
    active: true,
    hasLogo: false,
    imageUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  mockUnits.push(unit);
  notifyUnitCountChange();
  return unit;
}

export function createMockMatrix(payload: CreateBranchPayload): BranchDto {
  return createMockUnit(payload, "matrix");
}

export function createMockBranch(payload: CreateBranchPayload): BranchDto {
  return createMockUnit(payload, "store");
}

export function updateMockUnit(
  id: string,
  payload: UpdateBranchPayload,
): BranchDto {
  const index = mockUnits.findIndex((unit) => unit.id === id);
  if (index < 0) {
    throw new MockUnitError(404, "NotFoundError", "Unidade não encontrada.");
  }

  const existing = mockUnits[index]!;
  const now = new Date().toISOString();
  const legalName =
    payload.legalName !== undefined
      ? payload.legalName.trim()
      : existing.legalName;

  if (!legalName) {
    throw new MockUnitError(400, "ValidationError", "Informe a razão social.");
  }

  const tradeName =
    payload.tradeName !== undefined
      ? payload.tradeName.trim() || null
      : existing.tradeName;

  const updated: BranchDto = {
    ...existing,
    legalName,
    tradeName,
    displayName: resolveDisplayName(legalName, tradeName),
    stateRegistration:
      payload.stateRegistration !== undefined
        ? payload.stateRegistration.trim() || null
        : existing.stateRegistration,
    municipalRegistration:
      payload.municipalRegistration !== undefined
        ? payload.municipalRegistration.trim() || null
        : existing.municipalRegistration,
    taxRegime: payload.taxRegime ?? existing.taxRegime,
    address: buildAddressFromPayload(payload, existing.address),
    phone:
      payload.phone !== undefined
        ? payload.phone.trim() || null
        : existing.phone,
    email:
      payload.email !== undefined
        ? payload.email.trim() || null
        : existing.email,
    timezone: payload.timezone?.trim() || existing.timezone,
    active: payload.active ?? existing.active,
    updatedAt: now,
  };

  mockUnits[index] = updated;
  notifyUnitCountChange();
  return updated;
}

/** @deprecated Use updateMockUnit */
export const updateMockBranch = updateMockUnit;

export function deleteMockUnit(id: string): BranchDto {
  const unit = getMockUnit(id);
  if (!unit) {
    throw new MockUnitError(404, "NotFoundError", "Unidade não encontrada.");
  }

  if (unit.kind === "matrix") {
    const hasActiveStores = mockUnits.some(
      (item) =>
        item.kind === "store" &&
        item.active &&
        item.matrixId === unit.id,
    );
    if (hasActiveStores) {
      throw new MockUnitError(
        409,
        "MatrixHasStoresError",
        "Não é possível desativar uma matriz com lojas ativas.",
      );
    }
  }

  const now = new Date().toISOString();
  const updated = { ...unit, active: false, updatedAt: now };
  mockUnits = mockUnits.map((item) => (item.id === id ? updated : item));
  notifyUnitCountChange();
  return updated;
}

/** @deprecated Use deleteMockUnit */
export const deleteMockBranch = deleteMockUnit;

function setMockUnitLogo(id: string, kind: BranchDto["kind"]): BranchDto {
  const unit = getMockUnit(id);
  if (!unit || unit.kind !== kind) {
    throw new MockUnitError(404, "NotFoundError", "Unidade não encontrada.");
  }

  const now = new Date().toISOString();
  const imagePath =
    kind === "matrix" ? `/v1/matrices/${id}/logo` : `/v1/branches/${id}/logo`;
  const updated: BranchDto = {
    ...unit,
    hasLogo: true,
    imageUrl: imagePath,
    updatedAt: now,
  };
  mockUnits = mockUnits.map((item) => (item.id === id ? updated : item));
  return updated;
}

function removeMockUnitLogo(id: string, kind: BranchDto["kind"]): BranchDto {
  const unit = getMockUnit(id);
  if (!unit || unit.kind !== kind) {
    throw new MockUnitError(404, "NotFoundError", "Unidade não encontrada.");
  }

  const now = new Date().toISOString();
  const updated: BranchDto = {
    ...unit,
    hasLogo: false,
    imageUrl: null,
    updatedAt: now,
  };
  mockUnits = mockUnits.map((item) => (item.id === id ? updated : item));
  return updated;
}

function parseJsonBody<T>(bodyText?: string | null): T {
  try {
    return bodyText ? (JSON.parse(bodyText) as T) : ({} as T);
  } catch {
    throw new MockUnitError(400, "ValidationError", "Corpo da requisição inválido.");
  }
}

function handleLogoRoute(
  segments: string[],
  method: string,
  kind: BranchDto["kind"],
): NextResponse | null {
  const collection = kind === "matrix" ? "matrices" : "branches";
  if (segments[0] !== "v1" || segments[1] !== collection || !segments[2]) {
    return null;
  }
  if (segments[3] !== "logo") {
    return null;
  }

  const unitId = segments[2];

  try {
    if (method === "POST") {
      return NextResponse.json({ data: setMockUnitLogo(unitId, kind) });
    }
    if (method === "DELETE") {
      return NextResponse.json({ data: removeMockUnitLogo(unitId, kind) });
    }
    if (method === "GET" || method === "HEAD") {
      const unit = getMockUnit(unitId);
      if (!unit?.hasLogo) {
        return mockError(404, "NotFoundError", "Logotipo não encontrado.");
      }
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );
      return new NextResponse(png, {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    }
  } catch (error) {
    if (error instanceof MockUnitError) {
      return mockError(error.status, error.code, error.message);
    }
    throw error;
  }

  return mockError(405, "MethodNotAllowed", "Método não permitido.");
}

export function handleMockMatricesRequest(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText?: string | null,
): NextResponse | null {
  const logoResponse = handleLogoRoute(segments, method, "matrix");
  if (logoResponse) return logoResponse;

  if (segments[0] !== "v1" || segments[1] !== "matrices") {
    return null;
  }

  const matrixId = segments[2];

  try {
    if (!matrixId) {
      if (method === "GET" || method === "HEAD") {
        return NextResponse.json(listMockMatrices(searchParams));
      }
      if (method === "POST") {
        const payload = parseJsonBody<CreateBranchPayload>(bodyText);
        const matrix = createMockMatrix(payload);
        return NextResponse.json({ data: matrix }, { status: 201 });
      }
    } else {
      if (method === "GET" || method === "HEAD") {
        const matrix = getMockUnit(matrixId);
        if (!matrix || matrix.kind !== "matrix") {
          return mockError(404, "NotFoundError", "Empresa matriz não encontrada.");
        }
        return NextResponse.json({ data: matrix });
      }
      if (method === "PUT") {
        const payload = parseJsonBody<UpdateBranchPayload>(bodyText);
        const matrix = updateMockUnit(matrixId, payload);
        return NextResponse.json({ data: matrix });
      }
      if (method === "DELETE") {
        const matrix = deleteMockUnit(matrixId);
        return NextResponse.json({ data: matrix });
      }
    }
  } catch (error) {
    if (error instanceof MockUnitError) {
      return mockError(error.status, error.code, error.message);
    }
    throw error;
  }

  return mockError(405, "MethodNotAllowed", "Método não permitido.");
}

/**
 * Trata rotas `v1/branches` e `v1/branches/:id` (lojas).
 * Retorna `null` quando o path não é de branches.
 */
export function handleMockBranchesRequest(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText?: string | null,
): NextResponse | null {
  const logoResponse = handleLogoRoute(segments, method, "store");
  if (logoResponse) return logoResponse;

  if (segments[0] !== "v1" || segments[1] !== "branches") {
    return null;
  }

  const branchId = segments[2];

  try {
    if (!branchId) {
      if (method === "GET" || method === "HEAD") {
        return NextResponse.json(listMockBranches(searchParams));
      }
      if (method === "POST") {
        const payload = parseJsonBody<CreateBranchPayload>(bodyText);
        const branch = createMockBranch(payload);
        return NextResponse.json({ data: branch }, { status: 201 });
      }
    } else {
      if (method === "GET" || method === "HEAD") {
        const branch = getMockUnit(branchId);
        if (!branch || branch.kind !== "store") {
          return mockError(404, "NotFoundError", "Loja não encontrada.");
        }
        return NextResponse.json({ data: branch });
      }
      if (method === "PUT") {
        const payload = parseJsonBody<UpdateBranchPayload>(bodyText);
        const branch = updateMockUnit(branchId, payload);
        return NextResponse.json({ data: branch });
      }
      if (method === "DELETE") {
        const branch = deleteMockUnit(branchId);
        return NextResponse.json({ data: branch });
      }
    }
  } catch (error) {
    if (error instanceof MockUnitError) {
      return mockError(error.status, error.code, error.message);
    }
    throw error;
  }

  return mockError(405, "MethodNotAllowed", "Método não permitido.");
}

export function handleMockOrganizationStructureRequest(
  segments: string[],
  method: string,
): NextResponse | null {
  if (
    segments[0] !== "v1" ||
    segments[1] !== "groups" ||
    segments[2] !== "current" ||
    segments[3] !== "structure"
  ) {
    return null;
  }

  if (method === "GET" || method === "HEAD") {
    return NextResponse.json({ data: getMockOrganizationStructure() });
  }

  return mockError(405, "MethodNotAllowed", "Método não permitido.");
}

export function setMockGroupName(name: string) {
  mockGroupName = name;
}
