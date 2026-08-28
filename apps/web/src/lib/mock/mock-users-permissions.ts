import { NextResponse } from "next/server";
import type {
  CreateMemberPayload,
  MemberDto,
  SectorDto,
  UpdateMemberPayload,
} from "@/features/users-permissions/api/member.dto";
import type {
  PermissionCatalogGroupDto,
  PermissionProfileDto,
  SavePermissionProfilePayload,
} from "@/features/users-permissions/api/permission-profile.dto";
import { functionalRoleIsSeller } from "@/features/users-permissions/lib/functional-roles";

const SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

// ——— Catálogo de permissões ———

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

/**
 * Módulos do backoffice de uma escola de negócios: a jornada vai do lead
 * (CRM) à matrícula (Comercial), passa pela entrega — turmas, eventos e
 * mentoria — e termina no acompanhamento do aluno (Secretaria, Financeiro).
 */
function buildPermissionCatalog(): {
  groups: PermissionCatalogGroupDto[];
  allIds: string[];
} {
  const groups: PermissionCatalogGroupDto[] = [
    {
      id: "comercial",
      label: "Comercial",
      scope: "backoffice",
      subgroups: [
        { id: "matriculas", label: "Matrículas", items: crudItems("comercial.matriculas", "matrículas") },
        { id: "propostas", label: "Propostas", items: crudItems("comercial.propostas", "propostas") },
        { id: "contratos", label: "Contratos", items: crudItems("comercial.contratos", "contratos") },
        { id: "descontos", label: "Descontos e bolsas", items: [
          { id: "comercial.descontos.apply", label: "Aplicar desconto dentro da alçada" },
          { id: "comercial.descontos.approve", label: "Aprovar desconto ou bolsa acima da alçada" },
        ]},
      ],
    },
    {
      id: "crm",
      label: "CRM",
      scope: "backoffice",
      subgroups: [
        { id: "alunos", label: "Alunos e empresas", items: crudItems("crm.alunos", "alunos") },
        { id: "leads", label: "Leads", items: crudItems("crm.leads", "leads") },
        { id: "agenda", label: "Agenda", items: crudItems("crm.agenda", "compromissos") },
      ],
    },
    {
      id: "academico",
      label: "Acadêmico",
      scope: "backoffice",
      subgroups: [
        { id: "turmas", label: "Turmas", items: crudItems("academico.turmas", "turmas") },
        { id: "cronograma", label: "Cronograma e aulas", items: crudItems("academico.cronograma", "aulas") },
        { id: "presenca", label: "Presença", items: [
          { id: "academico.presenca.view", label: "Visualizar presença" },
          { id: "academico.presenca.update", label: "Registrar presença" },
        ]},
        { id: "certificados", label: "Certificados", items: crudItems("academico.certificados", "certificados") },
      ],
    },
    {
      id: "eventos",
      label: "Eventos e imersões",
      scope: "backoffice",
      subgroups: [
        { id: "eventos", label: "Eventos", items: crudItems("eventos.eventos", "eventos") },
        { id: "inscricoes", label: "Inscrições", items: crudItems("eventos.inscricoes", "inscrições") },
        { id: "credenciamento", label: "Credenciamento", items: [
          { id: "eventos.credenciamento.view", label: "Visualizar credenciamento" },
          { id: "eventos.credenciamento.update", label: "Fazer check-in de participante" },
        ]},
      ],
    },
    {
      id: "mentoria",
      label: "Mentoria e consultoria",
      scope: "backoffice",
      subgroups: [
        { id: "sessoes", label: "Sessões", items: crudItems("mentoria.sessoes", "sessões") },
        { id: "planos", label: "Planos de ação", items: crudItems("mentoria.planos", "planos de ação") },
        { id: "diagnosticos", label: "Diagnósticos", items: crudItems("mentoria.diagnosticos", "diagnósticos") },
      ],
    },
    {
      id: "conteudo",
      label: "Conteúdo e EAD",
      scope: "backoffice",
      subgroups: [
        { id: "trilhas", label: "Trilhas e programas", items: crudItems("conteudo.trilhas", "trilhas") },
        { id: "materiais", label: "Materiais de aula", items: crudItems("conteudo.materiais", "materiais") },
        { id: "acessos", label: "Acessos do aluno", items: [
          { id: "conteudo.acessos.view", label: "Visualizar acessos" },
          { id: "conteudo.acessos.update", label: "Liberar ou bloquear acesso" },
        ]},
      ],
    },
    {
      id: "secretaria",
      label: "Secretaria",
      scope: "backoffice",
      subgroups: [
        { id: "documentos", label: "Documentos", items: crudItems("secretaria.documentos", "documentos") },
        { id: "pendencias", label: "Pendências", items: crudItems("secretaria.pendencias", "pendências") },
        { id: "anexos", label: "Anexos", items: crudItems("secretaria.anexos", "anexos") },
      ],
    },
    {
      id: "financeiro",
      label: "Financeiro",
      scope: "backoffice",
      subgroups: [
        { id: "lancamentos", label: "Lançamentos", items: crudItems("fin.lancamentos", "lançamentos") },
        { id: "conciliacao", label: "Conciliação", items: crudItems("fin.conciliacao", "conciliações") },
        { id: "inadimplencia", label: "Inadimplência", items: crudItems("fin.inadimplencia", "cobranças") },
        { id: "comissoes", label: "Comissões", items: crudItems("fin.comissoes", "comissões") },
        { id: "custo", label: "Receita e custo de turma", items: [
          { id: "fin.receita.view", label: "Visualizar receita por turma" },
          { id: "fin.custo.view", label: "Visualizar custo por turma" },
        ]},
      ],
    },
    {
      id: "relatorios",
      label: "Relatórios",
      scope: "backoffice",
      subgroups: [
        { id: "dre", label: "DRE", items: [{ id: "rel.dre.view", label: "Visualizar DRE" }] },
        { id: "benchmark", label: "Benchmark entre unidades", items: [{ id: "rel.benchmark.view", label: "Visualizar benchmark" }] },
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

const CATALOG = buildPermissionCatalog();

function allPermissionIds(): string[] {
  return CATALOG.allIds;
}

/** Comercial completo: da captação do lead ao contrato assinado. */
function commercialPermissions(): string[] {
  return CATALOG.allIds.filter(
    (id) =>
      id.startsWith("comercial.") ||
      id.startsWith("crm.") ||
      id.startsWith("rel."),
  );
}

/** Pré-vendas mexe no funil, não no fechamento. */
function sdrPermissions(): string[] {
  return [
    ...CATALOG.allIds.filter(
      (id) => id.startsWith("crm.leads") || id.startsWith("crm.agenda"),
    ),
    "crm.alunos.view",
    "comercial.propostas.view",
  ];
}

/** Sucesso do aluno acompanha quem já entrou: presença, pendências, renovação. */
function studentSuccessPermissions(): string[] {
  return [
    ...CATALOG.allIds.filter(
      (id) => id.startsWith("crm.alunos") || id.startsWith("crm.agenda"),
    ),
    "academico.turmas.view",
    "academico.presenca.view",
    "academico.presenca.update",
    "conteudo.acessos.view",
    "secretaria.pendencias.view",
    "secretaria.pendencias.update",
    "comercial.matriculas.view",
  ];
}

/** Coordenação monta a entrega: turmas, cronograma, conteúdo, certificados. */
function academicPermissions(): string[] {
  return [
    ...CATALOG.allIds.filter(
      (id) => id.startsWith("academico.") || id.startsWith("conteudo."),
    ),
    "crm.alunos.view",
    "rel.kpis.view",
  ];
}

/** Quem dá a aula: vê a turma e registra presença, não edita o programa. */
function facilitatorPermissions(): string[] {
  return [
    "academico.turmas.view",
    "academico.cronograma.view",
    "academico.presenca.view",
    "academico.presenca.update",
    "conteudo.materiais.view",
    "crm.alunos.view",
  ];
}

function eventPermissions(): string[] {
  return [
    ...CATALOG.allIds.filter(
      (id) => id.startsWith("eventos.") || id.startsWith("crm.agenda"),
    ),
    "crm.alunos.view",
    "academico.turmas.view",
  ];
}

function secretaryPermissions(): string[] {
  return [
    ...CATALOG.allIds.filter((id) => id.startsWith("secretaria.")),
    "academico.certificados.view",
    "academico.certificados.create",
    "comercial.contratos.view",
    "crm.alunos.view",
  ];
}

function financePermissions(): string[] {
  return [
    ...CATALOG.allIds.filter((id) => id.startsWith("fin.")),
    "comercial.contratos.view",
    "crm.alunos.view",
    "rel.dre.view",
    "rel.kpis.view",
  ];
}

function marketingPermissions(): string[] {
  return [
    ...CATALOG.allIds.filter((id) => id.startsWith("crm.leads")),
    "crm.agenda.view",
    "eventos.eventos.view",
    "eventos.inscricoes.view",
    "rel.kpis.view",
  ];
}

function viewerPermissions(): string[] {
  return CATALOG.allIds.filter((id) => id.endsWith(".view"));
}

/** Contador lê tudo, menos o que revela margem da operação. */
function accountantPermissions(): string[] {
  return CATALOG.allIds.filter(
    (id) =>
      (id.endsWith(".view") &&
        !id.startsWith("fin.receita") &&
        !id.startsWith("fin.custo")) ||
      id === "rel.dre.view" ||
      id === "rel.kpis.view",
  );
}

// ——— Perfis ———

const PROFILE_ADMIN_ID = "00000000-0000-4000-8000-000000000101";
const PROFILE_GERENTE_ID = "00000000-0000-4000-8000-000000000102";
const PROFILE_COMERCIAL_ID = "00000000-0000-4000-8000-000000000103";
const PROFILE_SDR_ID = "00000000-0000-4000-8000-000000000104";
const PROFILE_SUCESSO_ID = "00000000-0000-4000-8000-000000000105";
const PROFILE_COORDENACAO_ID = "00000000-0000-4000-8000-000000000106";
const PROFILE_FACILITADOR_ID = "00000000-0000-4000-8000-000000000107";
const PROFILE_EVENTOS_ID = "00000000-0000-4000-8000-000000000108";
const PROFILE_SECRETARIA_ID = "00000000-0000-4000-8000-000000000109";
const PROFILE_FINANCEIRO_ID = "00000000-0000-4000-8000-000000000110";
const PROFILE_MARKETING_ID = "00000000-0000-4000-8000-000000000111";
const PROFILE_CONTADOR_ID = "00000000-0000-4000-8000-000000000112";
const PROFILE_VIEWER_ID = "00000000-0000-4000-8000-000000000113";

const mockProfiles: PermissionProfileDto[] = [
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
    name: "Gerente de unidade",
    description: "Comercial, entrega e resultado da unidade, com aprovações.",
    isSystem: false,
    systemKey: "gerente-unidade",
    permissionIds: [
      ...commercialPermissions(),
      ...academicPermissions(),
      ...eventPermissions(),
      "fin.inadimplencia.view",
      "fin.comissoes.view",
    ],
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_COMERCIAL_ID,
    name: "Consultor comercial",
    description: "Negocia matrículas; desconto só dentro da alçada.",
    isSystem: false,
    systemKey: "consultor-comercial",
    permissionIds: commercialPermissions().filter(
      (id) => id !== "comercial.descontos.approve" && !id.startsWith("rel.benchmark"),
    ),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_SDR_ID,
    name: "SDR / pré-vendas",
    description: "Qualifica leads e agenda reuniões para o comercial.",
    isSystem: false,
    systemKey: "sdr",
    permissionIds: sdrPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_SUCESSO_ID,
    name: "Sucesso do aluno",
    description: "Acompanha presença, pendências e renovação do aluno.",
    isSystem: false,
    systemKey: "sucesso-do-aluno",
    permissionIds: studentSuccessPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_COORDENACAO_ID,
    name: "Coordenação acadêmica",
    description: "Turmas, cronograma, conteúdo e certificados.",
    isSystem: false,
    systemKey: "coordenador-academico",
    permissionIds: academicPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_FACILITADOR_ID,
    name: "Facilitador",
    description: "Vê a turma e registra presença; não edita o programa.",
    isSystem: false,
    systemKey: "facilitador",
    permissionIds: facilitatorPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_EVENTOS_ID,
    name: "Produção de eventos",
    description: "Imersões e eventos: inscrições e credenciamento.",
    isSystem: false,
    systemKey: "producao-eventos",
    permissionIds: eventPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_SECRETARIA_ID,
    name: "Secretaria acadêmica",
    description: "Documentos, contratos, certificados e pendências.",
    isSystem: false,
    systemKey: "secretaria",
    permissionIds: secretaryPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_FINANCEIRO_ID,
    name: "Financeiro",
    description: "Recebimentos, inadimplência, conciliação e comissões.",
    isSystem: false,
    systemKey: "financeiro",
    permissionIds: financePermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_MARKETING_ID,
    name: "Marketing",
    description: "Campanhas, leads e desempenho das turmas.",
    isSystem: false,
    systemKey: "marketing",
    permissionIds: marketingPermissions(),
    deletedAt: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: PROFILE_CONTADOR_ID,
    name: "Contador",
    description: "Leitura financeira, sem receita e custo por turma.",
    isSystem: false,
    systemKey: "contador",
    permissionIds: accountantPermissions(),
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

function buildMemberDto(
  partial: Omit<
    MemberDto,
    | "isSeller"
    | "extraSectors"
    | "pdvCode"
    | "hasPdvPin"
    | "pdvLocked"
    | "pdvLockedUntil"
    | "pdvPinUpdatedAt"
  > & { isSeller?: boolean; extraSectors?: SectorDto[] },
): MemberDto {
  return {
    ...partial,
    isSeller: partial.isSeller ?? functionalRoleIsSeller(partial.functionalRole),
    extraSectors: (partial.extraSectors ?? []).filter(
      (sector) => sector !== partial.sector,
    ),
    pdvCode: null,
    hasPdvPin: false,
    pdvLocked: false,
    pdvLockedUntil: null,
    pdvPinUpdatedAt: null,
  };
}

const mockMembers: MemberDto[] = [
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000201",
    userId: "00000000-0000-4000-8000-000000000301",
    name: "Usuário",
    email: "usuario@febrahub.local",
    role: "OWNER",
    sector: "geral",
    active: true,
    functionalRole: "ADMIN",
    permissionProfile: { id: PROFILE_ADMIN_ID, name: "Administrador", systemKey: "administrador" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000202",
    userId: "00000000-0000-4000-8000-000000000302",
    name: "Ana Gestora",
    email: "ana.gestora@febrahub.local",
    role: "MANAGER",
    sector: "geral",
    extraSectors: ["comercial", "financeiro"],
    active: true,
    functionalRole: "UNIT_MANAGER",
    permissionProfile: { id: PROFILE_GERENTE_ID, name: "Gerente de unidade", systemKey: "gerente-unidade" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000203",
    userId: "00000000-0000-4000-8000-000000000303",
    name: "Bruno Comercial",
    email: "bruno.comercial@febrahub.local",
    role: "MEMBER",
    sector: "comercial",
    active: true,
    functionalRole: "COMMERCIAL_CONSULTANT",
    permissionProfile: { id: PROFILE_COMERCIAL_ID, name: "Consultor comercial", systemKey: "consultor-comercial" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000204",
    userId: "00000000-0000-4000-8000-000000000304",
    name: "Carla Norte",
    email: "carla.norte@febrahub.local",
    role: "MEMBER",
    sector: "comercial",
    active: true,
    functionalRole: "COMMERCIAL_CONSULTANT",
    permissionProfile: { id: PROFILE_COMERCIAL_ID, name: "Consultor comercial", systemKey: "consultor-comercial" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000205",
    userId: "00000000-0000-4000-8000-000000000305",
    name: "Diego Pré-vendas",
    email: "diego.prevendas@febrahub.local",
    role: "MEMBER",
    sector: "comercial",
    extraSectors: ["crm"],
    active: true,
    functionalRole: "SDR",
    permissionProfile: { id: PROFILE_SDR_ID, name: "SDR / pré-vendas", systemKey: "sdr" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000206",
    userId: "00000000-0000-4000-8000-000000000306",
    name: "Eduardo Facilitador",
    email: "eduardo.facilitador@febrahub.local",
    role: "MEMBER",
    sector: "pedagogico",
    active: true,
    functionalRole: "FACILITATOR",
    permissionProfile: { id: PROFILE_FACILITADOR_ID, name: "Facilitador", systemKey: "facilitador" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000207",
    userId: "00000000-0000-4000-8000-000000000307",
    name: "Fernanda Secretaria",
    email: "fernanda.secretaria@febrahub.local",
    role: "MEMBER",
    sector: "pedagogico",
    active: true,
    functionalRole: "SECRETARY",
    permissionProfile: { id: PROFILE_SECRETARIA_ID, name: "Secretaria acadêmica", systemKey: "secretaria" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000208",
    userId: "00000000-0000-4000-8000-000000000308",
    name: "Gustavo Contador",
    email: "gustavo.contador@febrahub.local",
    role: "MEMBER",
    sector: "financeiro",
    active: true,
    functionalRole: "ACCOUNTANT",
    permissionProfile: { id: PROFILE_CONTADOR_ID, name: "Contador", systemKey: "contador" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000209",
    userId: "00000000-0000-4000-8000-000000000309",
    name: "Helena Financeiro",
    email: "helena.financeiro@febrahub.local",
    role: "MEMBER",
    sector: "financeiro",
    active: true,
    functionalRole: "FINANCE",
    permissionProfile: { id: PROFILE_FINANCEIRO_ID, name: "Financeiro", systemKey: "financeiro" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000210",
    userId: "00000000-0000-4000-8000-000000000310",
    name: "Igor Sul",
    email: "igor.sul@febrahub.local",
    role: "MANAGER",
    sector: "loja",
    extraSectors: ["estoque"],
    active: true,
    functionalRole: "UNIT_MANAGER",
    permissionProfile: { id: PROFILE_GERENTE_ID, name: "Gerente de unidade", systemKey: "gerente-unidade" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000211",
    userId: "00000000-0000-4000-8000-000000000311",
    name: "Julia Campinas",
    email: "julia.campinas@febrahub.local",
    role: "MEMBER",
    sector: "pedagogico",
    active: true,
    functionalRole: "STUDENT_SUCCESS",
    permissionProfile: { id: PROFILE_SUCESSO_ID, name: "Sucesso do aluno", systemKey: "sucesso-do-aluno" },
    createdAt: SEED_TIMESTAMP,
  }),
  buildMemberDto({
    id: "00000000-0000-4000-8000-000000000212",
    userId: "00000000-0000-4000-8000-000000000312",
    name: "Ex-colaborador",
    email: "ex@febrahub.local",
    role: "MEMBER",
    sector: "geral",
    active: false,
    functionalRole: "VIEWER",
    permissionProfile: { id: PROFILE_VIEWER_ID, name: "Somente leitura", systemKey: "somente-leitura" },
    createdAt: SEED_TIMESTAMP,
  }),
];

let nextMemberSeq = 300;
let nextProfileSeq = 200;

function mockError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
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
  const functionalRole = payload.functionalRole ?? "VIEWER";
  const name = `${payload.firstName} ${payload.lastName}`.trim();

  return buildMemberDto({
    id,
    userId,
    name,
    email: payload.email,
    role: payload.role ?? "MEMBER",
    active: true,
    functionalRole,
    sector: payload.sector ?? "geral",
    extraSectors: payload.extraSectors ?? [],
    permissionProfile: profile
      ? { id: profile.id, name: profile.name, systemKey: profile.systemKey }
      : null,
    isSeller: payload.isSeller,
    createdAt: new Date().toISOString(),
  });
}

export function handleMockUsersPermissionsRequest(
  segments: string[],
  method: string,
  searchParams: URLSearchParams,
  bodyText?: string | null,
): NextResponse | null {
  if (segments[0] === "v1" && segments[1] === "permission-catalog") {
    if (method === "GET" || method === "HEAD") {
      return NextResponse.json({ data: CATALOG });
    }
    return mockError(405, "MethodNotAllowed", "Método não permitido.");
  }

  if (segments[0] === "v1" && segments[1] === "permission-profiles") {
    return handlePermissionProfiles(segments, method, searchParams, bodyText);
  }

  if (segments[0] === "v1" && segments[1] === "members") {
    return handleMembers(segments, method, searchParams, bodyText);
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
): NextResponse {
  const id = segments[2];
  const subAction = segments[3];

  if (method === "GET" && !id) {
    const page = Number(searchParams.get("page") ?? 1) || 1;
    const perPage = Number(searchParams.get("perPage") ?? 20) || 20;
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const activeOnly = searchParams.get("active") === "true";

    let items = [...mockMembers];
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

    const activeCount = mockMembers.filter((m) => m.active).length;
    const deletedCount = mockMembers.filter((m) => !m.active).length;

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

      const profile = payload.permissionProfileId
        ? profileById(payload.permissionProfileId)
        : null;
      const functionalRole = payload.functionalRole ?? current.functionalRole;

      mockMembers[index] = buildMemberDto({
        ...current,
        role: payload.role ?? current.role,
        active: payload.active ?? current.active,
        functionalRole,
        sector: payload.sector ?? current.sector,
        extraSectors: payload.extraSectors ?? current.extraSectors,
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

