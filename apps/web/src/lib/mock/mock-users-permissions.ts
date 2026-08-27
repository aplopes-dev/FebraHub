import { NextResponse } from "next/server";
import type {
  CreateMemberPayload,
  FunctionalRoleDto,
  GeographicScopeLevelDto,
  MemberDto,
  UpdateMemberPayload,
} from "@/features/users-permissions/api/member.dto";
import type {
  PermissionCatalogGroupDto,
  PermissionProfileDto,
  SavePermissionProfilePayload,
} from "@/features/users-permissions/api/permission-profile.dto";
import { functionalRoleIsSeller } from "@/features/users-permissions/lib/functional-roles";
import {
  actorCanAssignScope,
  filterMembersByActorScope,
  memberScopeTarget,
} from "@/features/users-permissions/lib/scope-rules";
import type { ActorScope } from "@/features/users-permissions/types/user";
import {
  getMockMatrixIds,
  getMockStoreIdsByMatrix,
  getMockUnit,
  MOCK_MATRIX_2_ID,
  MOCK_MATRIX_ID,
  MOCK_STORE_CAMPINAS_ID,
  MOCK_STORE_ID,
  MOCK_STORE_NORTE_ID,
} from "@/lib/mock/mock-branches";

export const MOCK_ACTOR_SCOPE_HEADER = "x-mock-actor-scope";

const SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

// ——— Catálogo de permissões DMS ———

function crudItems(
  prefix: string,
  label: string,
): { id: string; label: string }[] {
  return [
    { id: `${prefix}.view`, label: `Visualizar ${label}` },
    { id: `${prefix}.create`, label: `Criar ${label}` },
    { id: `${prefix}.update`, label: `Atualizar ${label}` },
    { id: `${prefix}.delete`, label: `Excluir ${label}` },
  ];
}

function buildDmsCatalog(): {
  groups: PermissionCatalogGroupDto[];
  allIds: string[];
} {
  const groups: PermissionCatalogGroupDto[] = [
    {
      id: "vendas",
      label: "Vendas",
      scope: "backoffice",
      subgroups: [
        { id: "negociacoes", label: "Negociações", items: crudItems("vendas.negociacoes", "negociações") },
        { id: "avaliacao", label: "Avaliação de usados", items: crudItems("vendas.avaliacao", "avaliações") },
        { id: "propostas", label: "Propostas", items: crudItems("vendas.propostas", "propostas") },
        { id: "fi", label: "F&I e produtos agregados", items: crudItems("vendas.fi", "F&I") },
        { id: "descontos", label: "Descontos e alçadas", items: [
          ...crudItems("vendas.descontos", "descontos"),
          { id: "vendas.descontos.approve", label: "Aprovar desconto acima da alçada" },
        ]},
      ],
    },
    {
      id: "crm",
      label: "CRM",
      scope: "backoffice",
      subgroups: [
        { id: "clientes", label: "Clientes", items: crudItems("crm.clientes", "clientes") },
        { id: "leads", label: "Leads", items: crudItems("crm.leads", "leads") },
        { id: "agenda", label: "Agenda", items: crudItems("crm.agenda", "compromissos") },
      ],
    },
    {
      id: "oficina",
      label: "Oficina",
      scope: "backoffice",
      subgroups: [
        { id: "os", label: "Ordens de serviço", items: crudItems("oficina.os", "OS") },
        { id: "agendamento", label: "Agendamento", items: crudItems("oficina.agendamento", "agendamentos") },
        { id: "orcamentos", label: "Orçamentos", items: [
          ...crudItems("oficina.orcamentos", "orçamentos"),
          { id: "oficina.orcamentos.approve", label: "Aprovar orçamento" },
        ]},
      ],
    },
    {
      id: "pecas",
      label: "Peças",
      scope: "backoffice",
      subgroups: [
        { id: "estoque", label: "Estoque", items: crudItems("pecas.estoque", "estoque") },
        { id: "balcao", label: "Balcão", items: crudItems("pecas.balcao", "vendas de balcão") },
        { id: "pedidos", label: "Pedidos", items: crudItems("pecas.pedidos", "pedidos") },
      ],
    },
    {
      id: "funilaria",
      label: "Funilaria",
      scope: "backoffice",
      subgroups: [
        { id: "os", label: "Ordens de serviço", items: crudItems("funilaria.os", "OS de funilaria") },
        { id: "orcamentos", label: "Orçamentos importados", items: crudItems("funilaria.orcamentos", "orçamentos importados") },
        { id: "pintura", label: "Pintura", items: crudItems("funilaria.pintura", "pintura") },
      ],
    },
    {
      id: "documentacao",
      label: "Documentação",
      scope: "backoffice",
      subgroups: [
        { id: "processos", label: "Processos", items: crudItems("doc.processos", "processos") },
        { id: "pendencias", label: "Pendências", items: crudItems("doc.pendencias", "pendências") },
        { id: "anexos", label: "Anexos", items: crudItems("doc.anexos", "anexos") },
      ],
    },
    {
      id: "patio",
      label: "Pátio / PDI",
      scope: "backoffice",
      subgroups: [
        { id: "recebimento", label: "Recebimento", items: crudItems("patio.recebimento", "recebimentos") },
        { id: "inspecao", label: "Inspeção", items: crudItems("patio.inspecao", "inspeções") },
        { id: "entrega", label: "Entrega", items: crudItems("patio.entrega", "entregas") },
      ],
    },
    {
      id: "financeiro",
      label: "Financeiro",
      scope: "backoffice",
      subgroups: [
        { id: "lancamentos", label: "Lançamentos", items: crudItems("fin.lancamentos", "lançamentos") },
        { id: "conciliacao", label: "Conciliação", items: crudItems("fin.conciliacao", "conciliações") },
        { id: "comissoes", label: "Comissões", items: crudItems("fin.comissoes", "comissões") },
        { id: "margem", label: "Margem e custo", items: [
          { id: "fin.margem.view", label: "Visualizar margem" },
          { id: "fin.custo.view", label: "Visualizar custo" },
        ]},
      ],
    },
    {
      id: "relatorios",
      label: "Relatórios",
      scope: "backoffice",
      subgroups: [
        { id: "dre", label: "DRE", items: [{ id: "rel.dre.view", label: "Visualizar DRE" }] },
        { id: "benchmark", label: "Benchmark entre lojas", items: [{ id: "rel.benchmark.view", label: "Visualizar benchmark" }] },
        { id: "kpis", label: "KPIs", items: [{ id: "rel.kpis.view", label: "Visualizar KPIs" }] },
      ],
    },
    {
      id: "configuracoes",
      label: "Configurações",
      scope: "backoffice",
      subgroups: [
        { id: "empresa", label: "Empresa", items: crudItems("cfg.empresa", "dados da empresa") },
        { id: "unidades", label: "Unidades", items: crudItems("cfg.unidades", "unidades") },
        { id: "usuarios", label: "Usuários", items: crudItems("cfg.usuarios", "usuários") },
      ],
    },
    {
      id: "transversal",
      label: "Transversal",
      scope: "backoffice",
      subgroups: [
        { id: "auditoria", label: "Auditoria", items: [{ id: "trans.auditoria.view", label: "Visualizar auditoria" }] },
        { id: "arquivos", label: "Arquivos", items: crudItems("trans.arquivos", "arquivos") },
        { id: "lgpd", label: "LGPD", items: crudItems("trans.lgpd", "consentimentos") },
      ],
    },
  ];

  const allIds = groups.flatMap((group) =>
    group.subgroups.flatMap((sub) => sub.items.map((item) => item.id)),
  );

  return { groups, allIds };
}

const DMS_CATALOG = buildDmsCatalog();

function allPermissionIds(): string[] {
  return DMS_CATALOG.allIds;
}

function salesPermissions(): string[] {
  return DMS_CATALOG.allIds.filter(
    (id) =>
      id.startsWith("vendas.") ||
      id.startsWith("crm.") ||
      id.startsWith("patio.") ||
      id.startsWith("fin.margem") ||
      id.startsWith("rel."),
  );
}

function fiPermissions(): string[] {
  return DMS_CATALOG.allIds.filter(
    (id) =>
      id.startsWith("vendas.fi") ||
      id.startsWith("vendas.propostas") ||
      id.startsWith("vendas.negociacoes") ||
      id.startsWith("crm.clientes"),
  );
}

function servicePermissions(): string[] {
  return DMS_CATALOG.allIds.filter(
    (id) =>
      id.startsWith("oficina.") ||
      id.startsWith("crm.clientes") ||
      id.startsWith("crm.agenda"),
  );
}

function workshopManagerPermissions(): string[] {
  return DMS_CATALOG.allIds.filter(
    (id) =>
      id.startsWith("oficina.") ||
      id.startsWith("funilaria.") ||
      id.startsWith("crm.clientes") ||
      id.startsWith("crm.agenda") ||
      id.startsWith("rel.kpis"),
  );
}

function technicianPermissions(): string[] {
  return [
    "oficina.os.view",
    "oficina.os.update",
    "oficina.agendamento.view",
    "crm.clientes.view",
  ];
}

function partsManagerPermissions(): string[] {
  return DMS_CATALOG.allIds.filter(
    (id) =>
      id.startsWith("pecas.") ||
      id.startsWith("crm.clientes") ||
      id.startsWith("rel.kpis"),
  );
}

function viewerPermissions(): string[] {
  return DMS_CATALOG.allIds.filter((id) => id.endsWith(".view"));
}

function docPermissions(): string[] {
  return DMS_CATALOG.allIds.filter((id) => id.startsWith("doc."));
}

function accountantPermissions(): string[] {
  return DMS_CATALOG.allIds.filter(
    (id) =>
      (id.endsWith(".view") && !id.startsWith("fin.margem") && !id.startsWith("fin.custo")) ||
      id === "rel.dre.view" ||
      id === "rel.kpis.view",
  );
}

function cashierPermissions(): string[] {
  return [
    "fin.lancamentos.view",
    "fin.lancamentos.create",
    "crm.clientes.view",
  ];
}

// ——— Perfis ———

const PROFILE_ADMIN_ID = "00000000-0000-4000-8000-000000000101";
const PROFILE_GERENTE_ID = "00000000-0000-4000-8000-000000000102";
const PROFILE_VENDAS_ID = "00000000-0000-4000-8000-000000000103";
const PROFILE_SERVICOS_ID = "00000000-0000-4000-8000-000000000104";
const PROFILE_AVALIADOR_ID = "00000000-0000-4000-8000-000000000105";
const PROFILE_DESPACHANTE_ID = "00000000-0000-4000-8000-000000000106";
const PROFILE_CONTADOR_ID = "00000000-0000-4000-8000-000000000107";
const PROFILE_CAIXA_ID = "00000000-0000-4000-8000-000000000108";
const PROFILE_GERENTE_OFICINA_ID = "00000000-0000-4000-8000-000000000109";
const PROFILE_GERENTE_PECAS_ID = "00000000-0000-4000-8000-000000000110";
const PROFILE_FI_ID = "00000000-0000-4000-8000-000000000111";
const PROFILE_TECNICO_ID = "00000000-0000-4000-8000-000000000112";
const PROFILE_VIEWER_ID = "00000000-0000-4000-8000-000000000113";

let mockProfiles: PermissionProfileDto[] = [
  {
    id: PROFILE_ADMIN_ID,
    name: "Administrador",
    description: "Acesso total ao sistema.",
    isSystem: true,
    systemKey: "administrador",
    permissionIds: allPermissionIds(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_GERENTE_ID,
    name: "Gerente de vendas",
    description: "Supervisiona vendas, aprova descontos e vê relatórios.",
    isSystem: false,
    systemKey: "gerente-vendas",
    permissionIds: salesPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_VENDAS_ID,
    name: "Consultor de vendas",
    description: "Negocia veículos e atende clientes no showroom.",
    isSystem: false,
    systemKey: "consultor-vendas",
    permissionIds: salesPermissions().filter((id) => !id.includes("approve") && !id.startsWith("rel.benchmark")),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_SERVICOS_ID,
    name: "Consultor de serviços",
    description: "Atendimento de oficina e orçamentos.",
    isSystem: false,
    systemKey: "consultor-servicos",
    permissionIds: servicePermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_AVALIADOR_ID,
    name: "Avaliador",
    description: "Avalia seminovos no pátio.",
    isSystem: false,
    systemKey: "avaliador",
    permissionIds: DMS_CATALOG.allIds.filter((id) => id.startsWith("vendas.avaliacao") || id.startsWith("patio.")),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_DESPACHANTE_ID,
    name: "Despachante",
    description: "Processos veiculares e documentação.",
    isSystem: false,
    systemKey: "despachante",
    permissionIds: docPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_CONTADOR_ID,
    name: "Contador",
    description: "Leitura financeira sem margem comercial.",
    isSystem: false,
    systemKey: "contador",
    permissionIds: accountantPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_CAIXA_ID,
    name: "Caixa",
    description: "Recebimentos e movimentação de caixa.",
    isSystem: false,
    systemKey: "caixa",
    permissionIds: cashierPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_GERENTE_OFICINA_ID,
    name: "Gerente de oficina",
    description: "Supervisiona oficina, funilaria e aprova orçamentos.",
    isSystem: false,
    systemKey: "gerente-oficina",
    permissionIds: workshopManagerPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_GERENTE_PECAS_ID,
    name: "Gerente de peças",
    description: "Estoque, balcão, pedidos e KPIs de peças.",
    isSystem: false,
    systemKey: "gerente-pecas",
    permissionIds: partsManagerPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_FI_ID,
    name: "Consultor F&I",
    description: "Financiamento, seguros e produtos agregados na venda.",
    isSystem: false,
    systemKey: "consultor-fi",
    permissionIds: fiPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_TECNICO_ID,
    name: "Técnico de oficina",
    description: "Execução de serviços e apontamento de horas.",
    isSystem: false,
    systemKey: "tecnico-oficina",
    permissionIds: technicianPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_VIEWER_ID,
    name: "Somente leitura",
    description: "Consulta operacional sem alterar registros.",
    isSystem: false,
    systemKey: "somente-leitura",
    permissionIds: viewerPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

function profileById(id: string): PermissionProfileDto | undefined {
  return mockProfiles.find((profile) => profile.id === id && profile.deletedAt == null);
}

function countActiveMembersForProfile(profileId: string): number {
  return mockMembers.filter(
    (member) => member.active && member.permissionProfile?.id === profileId,
  ).length;
}

function enrichProfileForList(profile: PermissionProfileDto): PermissionProfileDto {
  return {
    ...profile,
    activeMemberCount: countActiveMembersForProfile(profile.id),
  };
}

function resolveBranchNames(ids: string[]): string[] {
  return ids
    .map((id) => getMockUnit(id)?.displayName ?? id)
    .filter(Boolean);
}

function resolveMatrixName(matrixId: string | null): string | null {
  if (!matrixId) return null;
  return getMockUnit(matrixId)?.displayName ?? null;
}

function buildMemberDto(
  partial: Omit<
    MemberDto,
    | "branchNames"
    | "matrixName"
    | "accessesAllBranches"
    | "isSeller"
    | "pdvCode"
    | "hasPdvPin"
    | "pdvLocked"
    | "pdvLockedUntil"
    | "pdvPinUpdatedAt"
  > & { isSeller?: boolean },
): MemberDto {
  const branchNames = resolveBranchNames(partial.branchIds);
  const matrixName = resolveMatrixName(partial.matrixId);
  const accessesAllBranches =
    partial.scopeLevel === "group" ||
    partial.scopeLevel === "matrix" ||
    partial.role === "OWNER" ||
    partial.role === "ADMIN";
  return {
    ...partial,
    branchNames,
    matrixName,
    accessesAllBranches,
    isSeller: partial.isSeller ?? functionalRoleIsSeller(partial.functionalRole),
    pdvCode: null,
    hasPdvPin: false,
    pdvLocked: false,
    pdvLockedUntil: null,
    pdvPinUpdatedAt: null,
  };
}

let mockMembers: MemberDto[] = [
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000201",
    userId: "00000000-0000-4000-8000-000000000301",
    name: "Usuário",
    email: "usuario@febrahub.local",
    role: "OWNER",
    active: true,
    scopeLevel: "group",
    matrixId: null,
    functionalRole: "ADMIN",
    permissionProfile: { id: PROFILE_ADMIN_ID, name: "Administrador", systemKey: "administrador" },
    branchIds: [],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000202",
    userId: "00000000-0000-4000-8000-000000000302",
    name: "Ana Gerente",
    email: "ana.gerente@febrahub.local",
    role: "ADMIN",
    active: true,
    scopeLevel: "matrix",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "MANAGER",
    permissionProfile: { id: PROFILE_GERENTE_ID, name: "Gerente de vendas", systemKey: "gerente-vendas" },
    branchIds: [],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000203",
    userId: "00000000-0000-4000-8000-000000000303",
    name: "Bruno Vendas",
    email: "bruno.vendas@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "branch",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "SALES_CONSULTANT",
    permissionProfile: { id: PROFILE_VENDAS_ID, name: "Consultor de vendas", systemKey: "consultor-vendas" },
    branchIds: [MOCK_STORE_ID],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000204",
    userId: "00000000-0000-4000-8000-000000000304",
    name: "Carla Norte",
    email: "carla.norte@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "branch",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "SALES_CONSULTANT",
    permissionProfile: { id: PROFILE_VENDAS_ID, name: "Consultor de vendas", systemKey: "consultor-vendas" },
    branchIds: [MOCK_STORE_NORTE_ID],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000205",
    userId: "00000000-0000-4000-8000-000000000305",
    name: "Diego Oficina",
    email: "diego.oficina@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "branch",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "SERVICE_ADVISOR",
    permissionProfile: { id: PROFILE_SERVICOS_ID, name: "Consultor de serviços", systemKey: "consultor-servicos" },
    branchIds: [MOCK_STORE_ID],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000206",
    userId: "00000000-0000-4000-8000-000000000306",
    name: "Eduardo Avaliador",
    email: "eduardo.avaliador@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "branch",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "USED_CAR_APPRAISER",
    permissionProfile: { id: PROFILE_AVALIADOR_ID, name: "Avaliador", systemKey: "avaliador" },
    branchIds: [MOCK_STORE_ID, MOCK_STORE_NORTE_ID],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000207",
    userId: "00000000-0000-4000-8000-000000000307",
    name: "Fernanda Docs",
    email: "fernanda.docs@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "matrix",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "DOC_CLERK",
    permissionProfile: { id: PROFILE_DESPACHANTE_ID, name: "Despachante", systemKey: "despachante" },
    branchIds: [],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000208",
    userId: "00000000-0000-4000-8000-000000000308",
    name: "Gustavo Contador",
    email: "gustavo.contador@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "group",
    matrixId: null,
    functionalRole: "ACCOUNTANT",
    permissionProfile: { id: PROFILE_CONTADOR_ID, name: "Contador", systemKey: "contador" },
    branchIds: [],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000209",
    userId: "00000000-0000-4000-8000-000000000309",
    name: "Helena Caixa",
    email: "helena.caixa@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "branch",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "CASHIER",
    permissionProfile: { id: PROFILE_CAIXA_ID, name: "Caixa", systemKey: "caixa" },
    branchIds: [MOCK_STORE_ID],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000210",
    userId: "00000000-0000-4000-8000-000000000310",
    name: "Igor Auto Sul",
    email: "igor.autosul@febrahub.local",
    role: "ADMIN",
    active: true,
    scopeLevel: "matrix",
    matrixId: MOCK_MATRIX_2_ID,
    functionalRole: "MANAGER",
    permissionProfile: { id: PROFILE_GERENTE_ID, name: "Gerente de vendas", systemKey: "gerente-vendas" },
    branchIds: [],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000211",
    userId: "00000000-0000-4000-8000-000000000311",
    name: "Julia Campinas",
    email: "julia.campinas@febrahub.local",
    role: "MEMBER",
    active: true,
    scopeLevel: "branch",
    matrixId: MOCK_MATRIX_2_ID,
    functionalRole: "SALES_CONSULTANT",
    permissionProfile: { id: PROFILE_VENDAS_ID, name: "Consultor de vendas", systemKey: "consultor-vendas" },
    branchIds: [MOCK_STORE_CAMPINAS_ID],
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000212",
    userId: "00000000-0000-4000-8000-000000000312",
    name: "Ex-funcionário",
    email: "ex@febrahub.local",
    role: "MEMBER",
    active: false,
    scopeLevel: "branch",
    matrixId: MOCK_MATRIX_ID,
    functionalRole: "VIEWER",
    permissionProfile: { id: PROFILE_CONTADOR_ID, name: "Contador", systemKey: "contador" },
    branchIds: [MOCK_STORE_ID],
    createdAt: SEED_TIMESTAMP,
  }),
];

let nextMemberSeq = 300;
let nextProfileSeq = 200;

function mockError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function parseMockActorScope(headerValue: string | null): ActorScope {
  if (!headerValue) {
    return { level: "group", matrixId: null, branchId: null };
  }
  try {
    const parsed = JSON.parse(headerValue) as ActorScope;
    if (
      parsed.level === "group" ||
      parsed.level === "matrix" ||
      parsed.level === "branch"
    ) {
      return {
        level: parsed.level,
        matrixId: parsed.matrixId ?? null,
        branchId: parsed.branchId ?? null,
      };
    }
  } catch {
    // fallback
  }
  return { level: "group", matrixId: null, branchId: null };
}

function assertCanManageTarget(actor: ActorScope, target: {
  scopeLevel: GeographicScopeLevelDto;
  matrixId: string | null;
  branchIds: string[];
}): NextResponse | null {
  const ok = actorCanAssignScope(
    actor,
    memberScopeTarget({
      scopeLevel: target.scopeLevel,
      matrixId: target.matrixId,
      branchIds: target.branchIds,
    }),
  );
  if (!ok) {
    return mockError(
      403,
      "Forbidden",
      "Você não pode criar ou alterar usuários fora do seu escopo de atuação.",
    );
  }
  return null;
}

function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    meta: { total, page: safePage, perPage, totalPages },
  };
}

function memberFromCreatePayload(
  payload: CreateMemberPayload,
  id: string,
  userId: string,
): MemberDto {
  const profile = profileById(payload.permissionProfileId);
  const scopeLevel = payload.scopeLevel ?? "branch";
  const matrixId = scopeLevel === "group" ? null : (payload.matrixId ?? null);
  const branchIds = scopeLevel === "branch" ? (payload.branchIds ?? []) : [];
  const functionalRole = payload.functionalRole ?? "VIEWER";
  const name = `${payload.firstName} ${payload.lastName}`.trim();

  return buildMemberDto({
    id,
    userId,
    name,
    email: payload.email,
    role: payload.role ?? "MEMBER",
    active: true,
    scopeLevel,
    matrixId,
    functionalRole,
    permissionProfile: profile
      ? { id: profile.id, name: profile.name, systemKey: profile.systemKey }
      : null,
    branchIds,
    isSeller: payload.isSeller,
    createdAt: new Date().toISOString(),
  });
}

export function handleMockUsersPermissionsRequest(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText?: string | null,
  actorScopeHeader?: string | null,
): NextResponse | null {
  const actor = parseMockActorScope(actorScopeHeader ?? null);

  if (segments[0] === "v1" && segments[1] === "permission-catalog") {
    if (method === "GET" || method === "HEAD") {
      return NextResponse.json({ data: DMS_CATALOG });
    }
    return mockError(405, "MethodNotAllowed", "Método não permitido.");
  }

  if (segments[0] === "v1" && segments[1] === "permission-profiles") {
    return handlePermissionProfiles(segments, method, searchParams, bodyText);
  }

  if (segments[0] === "v1" && segments[1] === "members") {
    return handleMembers(segments, method, searchParams, bodyText, actor);
  }

  return null;
}

function handlePermissionProfiles(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText?: string | null,
): NextResponse {
  const id = segments[2];

  if (method === "GET" && !id) {
    const page = Number(searchParams.get("page") ?? 1) || 1;
    const perPage = Number(searchParams.get("perPage") ?? 20) || 20;
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const activeOnly =
      searchParams.get("activeOnly") === "true" ||
      searchParams.get("active") === "true";

    let items = mockProfiles.filter((profile) =>
      activeOnly ? profile.deletedAt == null : true,
    );
    if (search) {
      items = items.filter(
        (profile) =>
          profile.name.toLowerCase().includes(search) ||
          profile.description.toLowerCase().includes(search),
      );
    }
    const activeCount = mockProfiles.filter((p) => p.deletedAt == null).length;
    const deletedCount = mockProfiles.length - activeCount;
    const { data, meta } = paginate(items, page, perPage);
    return NextResponse.json({
      data: data.map(enrichProfileForList),
      meta,
      tabCounts: { active: activeCount, deleted: deletedCount },
    });
  }

  if (method === "GET" && id) {
    const profile = mockProfiles.find((item) => item.id === id);
    if (!profile) {
      return mockError(404, "NotFoundError", "Perfil não encontrado.");
    }
    return NextResponse.json({ data: profile });
  }

  if (method === "POST" && !id) {
    try {
      const payload = JSON.parse(bodyText ?? "{}") as SavePermissionProfilePayload;
      const profile: PermissionProfileDto = {
        id: `00000000-0000-4000-8000-000000000${String(nextProfileSeq++).padStart(3, "0")}`,
        name: payload.name,
        description: payload.description,
        isSystem: false,
        systemKey: null,
        permissionIds: payload.permissionIds,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockProfiles.push(profile);
      return NextResponse.json({ data: profile }, { status: 201 });
    } catch {
      return mockError(400, "ValidationError", "Payload inválido.");
    }
  }

  if ((method === "PUT" || method === "PATCH") && id) {
    const index = mockProfiles.findIndex((item) => item.id === id);
    if (index === -1) {
      return mockError(404, "NotFoundError", "Perfil não encontrado.");
    }
    if (mockProfiles[index].isSystem) {
      return mockError(403, "Forbidden", "Perfil de sistema não pode ser alterado.");
    }
    try {
      const payload = JSON.parse(bodyText ?? "{}") as SavePermissionProfilePayload;
      mockProfiles[index] = {
        ...mockProfiles[index],
        name: payload.name,
        description: payload.description,
        permissionIds: payload.permissionIds,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ data: mockProfiles[index] });
    } catch {
      return mockError(400, "ValidationError", "Payload inválido.");
    }
  }

  if (method === "DELETE" && id) {
    const index = mockProfiles.findIndex((item) => item.id === id);
    if (index === -1) {
      return mockError(404, "NotFoundError", "Perfil não encontrado.");
    }
    if (mockProfiles[index].isSystem) {
      return mockError(403, "Forbidden", "Perfil de sistema não pode ser excluído.");
    }
    const inUse = mockMembers.some(
      (member) => member.permissionProfile?.id === id && member.active,
    );
    if (inUse) {
      return mockError(
        409,
        "ConflictError",
        "Ainda há usuários usando este perfil.",
      );
    }
    mockProfiles[index] = {
      ...mockProfiles[index],
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ data: mockProfiles[index] });
  }

  return mockError(405, "MethodNotAllowed", "Método não permitido.");
}

function handleMembers(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText: string | null | undefined,
  actor: ActorScope,
): NextResponse {
  const id = segments[2];
  const subAction = segments[3];

  if (method === "GET" && !id) {
    const page = Number(searchParams.get("page") ?? 1) || 1;
    const perPage = Number(searchParams.get("perPage") ?? 20) || 20;
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const activeOnly = searchParams.get("active") === "true";

    let items = filterMembersByActorScope(mockMembers, actor);
    if (activeOnly) {
      items = items.filter((member) => member.active);
    }
    if (search) {
      items = items.filter(
        (member) =>
          member.name.toLowerCase().includes(search) ||
          member.email.toLowerCase().includes(search),
      );
    }

    const activeCount = filterMembersByActorScope(
      mockMembers.filter((m) => m.active),
      actor,
    ).length;
    const deletedCount = filterMembersByActorScope(
      mockMembers.filter((m) => !m.active),
      actor,
    ).length;

    const { data, meta } = paginate(items, page, perPage);
    return NextResponse.json({ data, meta, tabCounts: { active: activeCount, deleted: deletedCount } });
  }

  if (method === "POST" && id && subAction === "reset-password") {
    const member = mockMembers.find((item) => item.id === id);
    if (!member) {
      return mockError(404, "NotFoundError", "Membro não encontrado.");
    }
    return NextResponse.json({
      data: {
        email: member.email,
        provisionalPassword: "Temp@1234",
      },
    });
  }

  if (method === "POST" && !id) {
    try {
      const payload = JSON.parse(bodyText ?? "{}") as CreateMemberPayload;
      const scopeLevel = payload.scopeLevel ?? "branch";
      const matrixId = scopeLevel === "group" ? null : (payload.matrixId ?? null);
      const branchIds = scopeLevel === "branch" ? (payload.branchIds ?? []) : [];

      const forbidden = assertCanManageTarget(actor, {
        scopeLevel,
        matrixId,
        branchIds,
      });
      if (forbidden) return forbidden;

      const memberId = `00000000-0000-4000-8000-000000000${String(nextMemberSeq++)}`;
      const userId = `00000000-0000-4000-8000-000000000${String(nextMemberSeq++)}`;
      const member = memberFromCreatePayload(payload, memberId, userId);
      mockMembers.push(member);
      return NextResponse.json(
        {
          data: member,
          meta: { provisionalPassword: "Temp@1234", linkedExistingAccount: false },
        },
        { status: 201 },
      );
    } catch {
      return mockError(400, "ValidationError", "Payload inválido.");
    }
  }

  if ((method === "PUT" || method === "PATCH") && id && !subAction) {
    const index = mockMembers.findIndex((item) => item.id === id);
    if (index === -1) {
      return mockError(404, "NotFoundError", "Membro não encontrado.");
    }
    try {
      const payload = JSON.parse(bodyText ?? "{}") as UpdateMemberPayload;
      const current = mockMembers[index];
      const scopeLevel = payload.scopeLevel ?? current.scopeLevel;
      const matrixId =
        scopeLevel === "group"
          ? null
          : payload.matrixId !== undefined
            ? payload.matrixId
            : current.matrixId;
      const branchIds =
        scopeLevel === "branch"
          ? (payload.branchIds ?? current.branchIds)
          : [];

      const forbidden = assertCanManageTarget(actor, {
        scopeLevel,
        matrixId,
        branchIds,
      });
      if (forbidden) return forbidden;

      const profile = payload.permissionProfileId
        ? profileById(payload.permissionProfileId)
        : null;
      const functionalRole = payload.functionalRole ?? current.functionalRole;

      mockMembers[index] = buildMemberDto({
        ...current,
        role: payload.role ?? current.role,
        active: payload.active ?? current.active,
        scopeLevel,
        matrixId,
        branchIds,
        functionalRole,
        isSeller: payload.isSeller ?? functionalRoleIsSeller(functionalRole),
        permissionProfile: profile
          ? { id: profile.id, name: profile.name, systemKey: profile.systemKey }
          : current.permissionProfile,
      });
      return NextResponse.json({ data: mockMembers[index] });
    } catch {
      return mockError(400, "ValidationError", "Payload inválido.");
    }
  }

  return mockError(405, "MethodNotAllowed", "Método não permitido.");
}

export { getMockMatrixIds, getMockStoreIdsByMatrix };
