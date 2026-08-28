import { NextResponse } from "next/server";
import { EMPTY_BRANCH_ADDRESS } from "@/features/branches/types/branch";
import {
  handleMockBranchesRequest,
  handleMockMatricesRequest,
  handleMockOrganizationStructureRequest,
  onMockBranchCountChange,
  setMockGroupName,
} from "@/lib/mock/mock-branches";
import { handleMockCustomersRequest } from "@/lib/mock/mock-customers";
import {
  handleMockUsersPermissionsRequest,
} from "@/lib/mock/mock-users-permissions";
import { handleMockVehicleModelsRequest } from "@/lib/mock/mock-vehicle-models";

/**
 * Respostas de demonstração da borda HTTP, enquanto o front não fala com a
 * API deste repositório (`apps/api`).
 *
 * Ligado **por ausência de backend**: sem `API_URL` no ambiente, os proxies
 * (`src/app/api/proxy/*`) respondem daqui em vez de tentar uma conexão que não
 * existe. Definir `API_URL` desliga o mock sem mudar código.
 *
 * Regra geral: **listagem responde vazia com 200**, para a tela renderizar seu
 * estado vazio em vez de uma faixa de erro. Só empresa e unidade têm dados de
 * verdade, porque sem elas o app nem chega a montar o shell.
 *
 * Nenhuma tela ou feature sabe que isto existe — o mock vive inteiramente na
 * borda. Para remover: apague `src/lib/mock/` e os dois `if (MOCK_API_ENABLED)`
 * nos proxies.
 */
export const MOCK_API_ENABLED = !process.env.API_URL;

let mockOrganization = {
  id: "00000000-0000-4000-8000-000000000001",
  document: "00000000000191",
  legalName: "FebraHub Demonstração LTDA",
  tradeName: "FebraHub Demo",
  displayName: "FebraHub Demo",
  status: "ACTIVE" as const,
  role: "OWNER" as const,
  branchCount: 3,
};

/**
 * `GET /v1/organizations/current` — dados cadastrais da empresa ativa.
 * Precisa ser objeto: a tela mapeia `dto.responsible` direto, sem guarda.
 */
const MOCK_CURRENT_ORGANIZATION = {
  id: mockOrganization.id,
  personType: "PJ",
  document: mockOrganization.document,
  legalName: mockOrganization.legalName,
  tradeName: mockOrganization.tradeName,
  displayName: mockOrganization.displayName,
  email: "contato@febrahub.local",
  phone: "1130000000",
  hasLogo: false,
  responsible: {
    name: "Usuário",
    document: "00000000191",
    email: "usuario@febrahub.local",
    phone: "11900000000",
  },
  status: "ACTIVE",
  platformStoreId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/** Estado mutável do grupo atual (Dados da empresa / DMS). */
let mockCurrentGroup = {
  id: mockOrganization.id,
  legalName: "Grupo Demonstração",
  tradeName: "FebraHub Demo",
  holdingDocument: "00000000000191",
  email: "contato@febrahub.local",
  phone: "1130000000",
  adminAddress: {
    ...EMPTY_BRANCH_ADDRESS,
    zipCode: "01310-100",
    street: "Avenida Paulista",
    number: "1000",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  },
  timezone: "America/Bahia",
  hasLogo: false,
  imageUrl: null as string | null,
  unitsCount: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

onMockBranchCountChange(({ stores, total }) => {
  mockOrganization = { ...mockOrganization, branchCount: stores };
  mockCurrentGroup = { ...mockCurrentGroup, unitsCount: total };
});

/** Envelope de listagem da API (`data` + `meta`), no formato que as features leem. */
function emptyList(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") ?? 1) || 1;
  const perPage = Number(searchParams.get("perPage") ?? 20) || 20;
  return {
    data: [],
    meta: { page, perPage, total: 0, totalPages: 0 },
    tabCounts: {},
  };
}

/** Um segmento que parece id (uuid ou número) indica rota de detalhe. */
function looksLikeId(segment: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment,
    ) || /^\d+$/.test(segment)
  );
}

function touchGroupUpdatedAt() {
  mockCurrentGroup = {
    ...mockCurrentGroup,
    updatedAt: new Date().toISOString(),
  };
}

export async function mockApiResponse(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText?: string | null,
): Promise<NextResponse> {
  const path = segments.join("/");

  const structureResponse = handleMockOrganizationStructureRequest(
    segments,
    method,
  );
  if (structureResponse) {
    return structureResponse;
  }

  const matricesResponse = handleMockMatricesRequest(
    segments,
    method,
    searchParams,
    bodyText,
  );
  if (matricesResponse) {
    return matricesResponse;
  }

  const branchesResponse = handleMockBranchesRequest(
    segments,
    method,
    searchParams,
    bodyText,
  );
  if (branchesResponse) {
    return branchesResponse;
  }

  const usersResponse = handleMockUsersPermissionsRequest(
    segments,
    method,
    searchParams,
    bodyText,
  );
  if (usersResponse) {
    return usersResponse;
  }

  const customersResponse = handleMockCustomersRequest(
    segments,
    method,
    searchParams,
  );
  if (customersResponse) {
    return customersResponse;
  }

  const vehicleModelsResponse = handleMockVehicleModelsRequest(
    segments,
    method,
    searchParams,
    bodyText,
  );
  if (vehicleModelsResponse) {
    return vehicleModelsResponse;
  }

  // Escopo — precisa de dados reais para o app passar da tela de entrada.
  if (path === "v1/organizations") {
    return NextResponse.json({ data: [mockOrganization] });
  }

  // Endpoints que devolvem **objeto**, não lista. O envelope de lista vazia
  // quebraria a tela: os mappers leem campos do objeto sem checar antes.
  if (path === "v1/organizations/current") {
    return NextResponse.json({ data: MOCK_CURRENT_ORGANIZATION });
  }

  if (path === "v1/groups/current") {
    if (method === "GET" || method === "HEAD") {
      return NextResponse.json({ data: mockCurrentGroup });
    }
    if (method === "PUT") {
      try {
        const payload = bodyText ? JSON.parse(bodyText) : {};
        mockCurrentGroup = {
          ...mockCurrentGroup,
          legalName:
            typeof payload.legalName === "string"
              ? payload.legalName
              : mockCurrentGroup.legalName,
          tradeName:
            typeof payload.tradeName === "string"
              ? payload.tradeName
              : payload.tradeName === undefined
                ? mockCurrentGroup.tradeName
                : null,
          holdingDocument:
            typeof payload.holdingDocument === "string"
              ? payload.holdingDocument
              : payload.holdingDocument === undefined
                ? mockCurrentGroup.holdingDocument
                : null,
          email:
            typeof payload.email === "string"
              ? payload.email
              : mockCurrentGroup.email,
          phone:
            typeof payload.phone === "string"
              ? payload.phone
              : payload.phone === undefined
                ? mockCurrentGroup.phone
                : null,
          adminAddress:
            payload.adminAddress && typeof payload.adminAddress === "object"
              ? { ...EMPTY_BRANCH_ADDRESS, ...payload.adminAddress }
              : mockCurrentGroup.adminAddress,
          timezone:
            typeof payload.timezone === "string"
              ? payload.timezone
              : mockCurrentGroup.timezone,
          updatedAt: new Date().toISOString(),
        };
        setMockGroupName(mockCurrentGroup.legalName);
      } catch {
        touchGroupUpdatedAt();
      }
      return NextResponse.json({ data: mockCurrentGroup });
    }
  }

  if (path === "v1/groups/current/logo") {
    if (method === "POST") {
      mockCurrentGroup = {
        ...mockCurrentGroup,
        hasLogo: true,
        imageUrl: "/v1/groups/current/logo",
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ data: mockCurrentGroup });
    }
    if (method === "DELETE") {
      mockCurrentGroup = {
        ...mockCurrentGroup,
        hasLogo: false,
        imageUrl: null,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ data: mockCurrentGroup });
    }
    if (method === "GET" || method === "HEAD") {
      if (!mockCurrentGroup.hasLogo) {
        return NextResponse.json(
          {
            error: {
              code: "NotFoundError",
              message: "Logotipo não encontrado.",
            },
          },
          { status: 404 },
        );
      }
      // Placeholder 1×1 PNG transparente — só para o <img> não quebrar.
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );
      return new NextResponse(png, {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    }
  }

  if (path === "v1/fiscal-default-taxes") {
    return NextResponse.json({
      data: {
        id: "00000000-0000-4000-8000-000000000003",
        icmsGroupId: null,
        ipiGroupId: null,
        pisCofinsGroupId: null,
        issqnGroupId: null,
        cfop: "",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
  }

  // Escrita: aceita e devolve eco, para o fluxo do formulário não travar.
  if (method !== "GET" && method !== "HEAD") {
    return NextResponse.json(
      {
        data: {
          id: "00000000-0000-4000-8000-000000000099",
          createdAt: new Date().toISOString(),
        },
      },
      { status: method === "POST" ? 201 : 200 },
    );
  }

  // Detalhe de um registro que não existe: 404 honesto, a tela mostra o vazio.
  const last = segments[segments.length - 1] ?? "";
  if (segments.length > 1 && looksLikeId(last)) {
    return NextResponse.json(
      {
        error: {
          code: "NotFoundError",
          message: "Registro não encontrado (modo de avaliação sem backend).",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json(emptyList(searchParams));
}
