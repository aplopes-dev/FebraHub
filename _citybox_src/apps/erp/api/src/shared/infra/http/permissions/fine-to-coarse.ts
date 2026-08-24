import {
  ALL_PERMISSION_ITEM_IDS,
  allPermissionItemIds,
} from './permission-catalog';

/**
 * Capabilities grossas usadas hoje em `@RequirePermission` nas rotas.
 * O PermissionGuard libera se o perfil tiver qualquer permissão fina
 * que mapeie para a capability exigida.
 */
export type CoarsePermission =
  | 'org.view'
  | 'org.manage'
  | 'org.branches.manage'
  | 'org.members.manage'
  | 'org.suppliers.manage'
  | 'org.customers.manage'
  | 'org.pos_terminals.manage'
  | 'store.catalog.manage'
  | 'store.settings.manage'
  | 'store.stock.manage'
  | 'store.sales.manage'
  | 'store.finance.manage';

const ERP_IDS = allPermissionItemIds('erp');
const PDV_IDS = allPermissionItemIds('pdv');

function withPrefix(ids: string[], prefixes: string[]): string[] {
  return ids.filter((id) => prefixes.some((prefix) => id.startsWith(prefix)));
}

function withSuffix(ids: string[], suffix: string): string[] {
  return ids.filter((id) => id.endsWith(suffix));
}

function without(ids: string[], excluded: string[]): string[] {
  return ids.filter((id) => !excluded.some((prefix) => id.startsWith(prefix)));
}

/** Prefixo fino → capability grosso (primeiro match ganha). */
const PREFIX_TO_COARSE: ReadonlyArray<{
  prefixes: string[];
  coarse: CoarsePermission[];
}> = [
  {
    prefixes: ['configuracoes.dados-empresa.'],
    coarse: ['org.manage', 'org.view'],
  },
  {
    prefixes: ['configuracoes.unidades-filiais.'],
    coarse: ['org.branches.manage', 'org.view'],
  },
  {
    prefixes: ['configuracoes.usuarios.', 'configuracoes.perfis-acesso.'],
    coarse: ['org.members.manage', 'org.view'],
  },
  {
    prefixes: ['estoque.fornecedores.'],
    coarse: ['org.suppliers.manage', 'org.view'],
  },
  {
    prefixes: ['clientes.'],
    coarse: ['org.customers.manage', 'org.view'],
  },
  {
    prefixes: ['pdv.cadastros.terminais.'],
    coarse: ['org.pos_terminals.manage', 'org.view'],
  },
  {
    prefixes: ['produtos.', 'produtos'],
    coarse: ['store.catalog.manage', 'org.view'],
  },
  {
    prefixes: ['estoque.'],
    coarse: ['store.stock.manage', 'org.view'],
  },
  {
    prefixes: ['vendas.'],
    coarse: ['store.sales.manage', 'org.view'],
  },
  {
    prefixes: ['financas.'],
    coarse: ['store.finance.manage', 'org.view'],
  },
  {
    prefixes: ['configuracoes.', 'relatorios.', 'dispositivos.', 'pdv.'],
    coarse: ['store.settings.manage', 'org.view'],
  },
];

/**
 * Resolve as capabilities grossas concedidas por um conjunto de IDs finos.
 *
 * ⚠️ O sufixo é avaliado **antes** do prefixo: uma permissão `.view` concede
 * apenas leitura (`org.view`), nunca a capability de escrita do seu módulo.
 * Sem essa ordem, um perfil marcado só com `estoque.inventarios.view` casaria
 * a regra de prefixo `estoque.` e receberia `store.stock.manage` — que é o
 * guard de todas as rotas de escrita do módulo (excluir depósito, lançar
 * movimentação, cancelar transferência). O perfil de sistema Financeiro, que
 * nasce com `withSuffix(withPrefix(ERP_IDS, ['estoque.']), '.view')`, era o
 * caso concreto afetado.
 */
export function resolveCoarseFromFine(fineIds: readonly string[]): Set<string> {
  const coarse = new Set<string>();
  for (const fine of fineIds) {
    if (fine.endsWith('.view')) {
      coarse.add('org.view');
      continue;
    }
    for (const rule of PREFIX_TO_COARSE) {
      if (rule.prefixes.some((prefix) => fine.startsWith(prefix))) {
        for (const c of rule.coarse) coarse.add(c);
        break;
      }
    }
  }
  return coarse;
}

export const SYSTEM_PROFILE_ADMINISTRADOR = 'administrador';
export const SYSTEM_PROFILE_GERENTE = 'gerente';
export const SYSTEM_PROFILE_FINANCEIRO = 'financeiro';
export const SYSTEM_PROFILE_CAIXA = 'caixa';
export const SYSTEM_PROFILE_VENDEDOR = 'vendedor';
export const SYSTEM_PROFILE_CONTADOR = 'contador';
export const SYSTEM_PROFILE_ATENDIMENTO = 'atendimento';

export type SystemPermissionProfileSeed = {
  systemKey: string;
  name: string;
  description: string;
  /**
   * Só o Administrador é travado (`true`). Os demais nascem no seed para o
   * sistema já ser utilizável, mas o lojista pode editar/excluir.
   */
  isSystem: boolean;
  permissionIds: string[];
};

const FINANCEIRO_PERMISSIONS = [
  ...withPrefix(ERP_IDS, ['financas.', 'relatorios.']),
  ...withSuffix(
    withPrefix(ERP_IDS, ['vendas.', 'produtos.', 'estoque.', 'clientes.']),
    '.view',
  ),
  'configuracoes.dados-empresa.view',
];

const GERENTE_PERMISSIONS = [
  ...without(ERP_IDS, [
    'configuracoes.usuarios.',
    'configuracoes.perfis-acesso.',
    'configuracoes.integracoes.',
  ]),
  ...PDV_IDS,
];

const CAIXA_PERMISSIONS = [
  // Operação de caixa: sem alçada de supervisor e sem sangria (pede PIN de
  // quem tem `pdv.operacao.caixa.withdrawal` — tipicamente Gerente/Admin).
  ...withPrefix(PDV_IDS, ['pdv.operacao.']).filter(
    (id) =>
      id !== 'pdv.operacao.alcada.authorize' &&
      id !== 'pdv.operacao.caixa.withdrawal',
  ),
  'pdv.cadastros.caixas.view',
  'vendas.vendas.view',
  'vendas.vendas.create',
  'clientes.clientes.view',
  'clientes.clientes.create',
];

const VENDEDOR_PERMISSIONS = [
  'pdv.operacao.venda.create',
  'pdv.operacao.venda.discount',
];

const CONTADOR_PERMISSIONS = [
  ...withSuffix(withPrefix(ERP_IDS, ['financas.']), '.view'),
  'financas.relatorios-resultados.view',
  'financas.relatorios-resultados.export',
  'relatorios.gerais.view',
  'relatorios.gerais.export',
];

const ATENDIMENTO_PERMISSIONS = [
  'vendas.vendas.view',
  'vendas.vendas.create',
  'clientes.clientes.view',
  'clientes.clientes.create',
  'pdv.operacao.venda.create',
];

export const SYSTEM_PERMISSION_PROFILES: readonly SystemPermissionProfileSeed[] =
  Object.freeze([
    {
      systemKey: SYSTEM_PROFILE_ADMINISTRADOR,
      name: 'Administrador',
      description: 'Administrador da empresa',
      isSystem: true,
      permissionIds: [...ALL_PERMISSION_ITEM_IDS],
    },
    {
      systemKey: SYSTEM_PROFILE_FINANCEIRO,
      name: 'Financeiro',
      description: 'Financeiro',
      isSystem: false,
      permissionIds: [...new Set(FINANCEIRO_PERMISSIONS)],
    },
    {
      systemKey: SYSTEM_PROFILE_GERENTE,
      name: 'Gerente',
      description: 'Gerente',
      isSystem: false,
      permissionIds: [...new Set(GERENTE_PERMISSIONS)],
    },
    {
      systemKey: SYSTEM_PROFILE_CAIXA,
      name: 'Caixa',
      description: 'Operador do PDV',
      isSystem: false,
      permissionIds: [...new Set(CAIXA_PERMISSIONS)],
    },
    {
      systemKey: SYSTEM_PROFILE_VENDEDOR,
      name: 'Vendedor',
      description: 'Vendedor, perfil não acessa o sistema',
      isSystem: false,
      permissionIds: [...new Set(VENDEDOR_PERMISSIONS)],
    },
    {
      systemKey: SYSTEM_PROFILE_CONTADOR,
      name: 'Contador',
      description: 'Acesso para o contador',
      isSystem: false,
      permissionIds: [...new Set(CONTADOR_PERMISSIONS)],
    },
    {
      systemKey: SYSTEM_PROFILE_ATENDIMENTO,
      name: 'Atendimento',
      description: 'Atendimento de Mesa',
      isSystem: false,
      permissionIds: [...new Set(ATENDIMENTO_PERMISSIONS)],
    },
  ]);
