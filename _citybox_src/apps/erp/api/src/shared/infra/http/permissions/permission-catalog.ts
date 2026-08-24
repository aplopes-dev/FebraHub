/**
 * Catálogo canônico de permissões finas do ERP Comércio.
 * Fonte de verdade da API — o web consome via GET /v1/permission-catalog.
 */

export type PermissionScope = 'erp' | 'pdv';

export type PermissionCatalogItem = {
  id: string;
  label: string;
};

export type PermissionCatalogSubgroup = {
  id: string;
  label: string;
  items: PermissionCatalogItem[];
};

export type PermissionCatalogGroup = {
  id: string;
  label: string;
  scope: PermissionScope;
  subgroups: PermissionCatalogSubgroup[];
};

function crudSubgroup(
  id: string,
  entityLabel: string,
  extra: PermissionCatalogItem[] = [],
): PermissionCatalogSubgroup {
  const lower = entityLabel.toLowerCase();
  return {
    id,
    label: entityLabel,
    items: [
      { id: `${id}.view`, label: `Pode visualizar ${lower}` },
      { id: `${id}.create`, label: `Pode criar ${lower}` },
      { id: `${id}.update`, label: `Pode atualizar ${lower}` },
      { id: `${id}.delete`, label: `Pode excluir ${lower}` },
      ...extra,
    ],
  };
}

function group(
  id: string,
  label: string,
  scope: PermissionScope,
  subgroups: PermissionCatalogSubgroup[],
): PermissionCatalogGroup {
  return { id, label, scope, subgroups };
}

const VENDAS_GROUP = group('vendas', 'Vendas', 'erp', [
  crudSubgroup('vendas.pedidos', 'Pedidos de venda'),
  crudSubgroup('vendas.vendas', 'Vendas', [
    {
      id: 'vendas.vendas.print',
      label: 'Pode imprimir e baixar PDF da venda',
    },
  ]),
  crudSubgroup('vendas.contratos', 'Contratos de venda', [
    {
      id: 'vendas.contratos.status',
      label: 'Pode gerenciar status de contratos',
    },
  ]),
  crudSubgroup('vendas.ordens-servico', 'Ordens de serviço', [
    {
      id: 'vendas.ordens-servico.gerar-venda',
      label: 'Pode gerar venda a partir da OS',
    },
  ]),
  crudSubgroup('vendas.promocoes', 'Promoções', [
    {
      id: 'vendas.promocoes.cupons',
      label: 'Pode baixar códigos de cupom',
    },
  ]),
]);

const PRODUTOS_GROUP = group('produtos', 'Produtos', 'erp', [
  crudSubgroup('produtos.produtos', 'Produtos', [
    {
      id: 'produtos.produtos.image',
      label: 'Pode alterar imagem do produto',
    },
  ]),
  crudSubgroup('produtos.categorias', 'Categorias'),
  crudSubgroup('produtos.variacoes', 'Variações e opções'),
  crudSubgroup('produtos.fichas-tecnicas', 'Fichas técnicas'),
  crudSubgroup('produtos.unidade-medida', 'Unidade de medida'),
  crudSubgroup('produtos.lista-precos', 'Listas de preço', [
    {
      id: 'produtos.lista-precos.reorder',
      label: 'Pode reordenar prioridade das listas',
    },
  ]),
  crudSubgroup('produtos.parametros-fiscais', 'Parâmetros fiscais'),
]);

const ESTOQUE_GROUP = group('estoque', 'Estoque', 'erp', [
  crudSubgroup('estoque.depositos', 'Depósitos de estoque'),
  crudSubgroup('estoque.movimentacoes', 'Movimentações de estoque'),
  crudSubgroup('estoque.categorias-movimentacao', 'Categorias de movimentação'),
  crudSubgroup('estoque.transferencias', 'Transferências', [
    {
      id: 'estoque.transferencias.cancel',
      label: 'Pode cancelar transferências',
    },
  ]),
  crudSubgroup('estoque.compras', 'Compras', [
    {
      id: 'estoque.compras.receive',
      label: 'Pode confirmar recebimento de compras',
    },
  ]),
  crudSubgroup('estoque.inventarios', 'Inventários', [
    {
      id: 'estoque.inventarios.finalize',
      label: 'Pode finalizar contagem de inventário',
    },
  ]),
  crudSubgroup('estoque.transportadoras', 'Transportadoras'),
  crudSubgroup('estoque.fornecedores', 'Fornecedores'),
  crudSubgroup('estoque.producao', 'Ordens de produção', [
    {
      id: 'estoque.producao.finalize',
      label: 'Pode finalizar produção',
    },
    {
      id: 'estoque.producao.cancel',
      label: 'Pode cancelar produção',
    },
  ]),
]);

const CLIENTES_GROUP = group('clientes', 'Clientes', 'erp', [
  crudSubgroup('clientes.clientes', 'Clientes'),
  crudSubgroup('clientes.categorias', 'Categorias de clientes'),
]);

const FINANCAS_GROUP = group('financas', 'Finanças', 'erp', [
  crudSubgroup('financas.lancamentos', 'Lançamentos', [
    {
      id: 'financas.lancamentos.transfer',
      label: 'Pode registrar transferências entre contas',
    },
  ]),
  crudSubgroup('financas.contas-bancarias', 'Contas bancárias'),
  crudSubgroup('financas.plano-contas', 'Plano de contas'),
  crudSubgroup('financas.grupo-financeiro', 'Grupo financeiro'),
  crudSubgroup('financas.centro-custo', 'Centro de custo'),
  crudSubgroup('financas.contratos-cartoes', 'Contratos de cartões e outros'),
  {
    id: 'financas.relatorios-resultados',
    label: 'Relatórios de resultados',
    items: [
      {
        id: 'financas.relatorios-resultados.view',
        label: 'Pode visualizar relatórios de resultados (DRE)',
      },
      {
        id: 'financas.relatorios-resultados.export',
        label: 'Pode exportar relatórios em PDF/Excel',
      },
    ],
  },
]);

const RELATORIOS_GROUP = group('relatorios', 'Relatórios', 'erp', [
  {
    id: 'relatorios.gerais',
    label: 'Relatórios gerais',
    items: [
      { id: 'relatorios.gerais.view', label: 'Pode visualizar relatórios' },
      { id: 'relatorios.gerais.export', label: 'Pode exportar relatórios' },
    ],
  },
]);

const DISPOSITIVOS_GROUP = group('dispositivos', 'Dispositivos', 'erp', [
  {
    id: 'dispositivos.dispositivos',
    label: 'Dispositivos',
    items: [
      {
        id: 'dispositivos.dispositivos.view',
        label: 'Pode visualizar dispositivos conectados',
      },
      {
        id: 'dispositivos.dispositivos.revoke',
        label: 'Pode desconectar dispositivos',
      },
    ],
  },
]);

const CONFIGURACOES_GROUP = group('configuracoes', 'Configurações', 'erp', [
  crudSubgroup('configuracoes.dados-empresa', 'Dados da empresa'),
  crudSubgroup('configuracoes.unidades-filiais', 'Unidades e filiais'),
  crudSubgroup('configuracoes.formas-pagamento', 'Formas de pagamento'),
  crudSubgroup('configuracoes.usuarios', 'Usuários', [
    {
      id: 'configuracoes.usuarios.sessions',
      label: 'Pode visualizar e revogar sessões ativas',
    },
  ]),
  crudSubgroup('configuracoes.perfis-acesso', 'Perfis de acesso'),
  crudSubgroup('configuracoes.integracoes', 'Integrações'),
]);

/** Autoriza exceções acima da alçada (supervisor no PDV). */
export const PDV_ALCADA_AUTHORIZE_PERMISSION =
  'pdv.operacao.alcada.authorize' as const;

/** Registra sangria no PDV — fora do perfil Caixa por padrão. */
export const PDV_CAIXA_WITHDRAWAL_PERMISSION =
  'pdv.operacao.caixa.withdrawal' as const;

const PDV_OPERACAO_GROUP = group('pdv.operacao', 'Operação de caixa', 'pdv', [
  {
    id: 'pdv.operacao.caixa',
    label: 'Caixa',
    items: [
      { id: 'pdv.operacao.caixa.open', label: 'Pode abrir caixa' },
      { id: 'pdv.operacao.caixa.close', label: 'Pode fechar caixa' },
      {
        id: 'pdv.operacao.caixa.reinforcement',
        label: 'Pode registrar suprimento',
      },
      {
        id: 'pdv.operacao.caixa.withdrawal',
        label: 'Pode registrar sangria',
      },
    ],
  },
  {
    id: 'pdv.operacao.venda',
    label: 'Venda no PDV',
    items: [
      { id: 'pdv.operacao.venda.create', label: 'Pode registrar venda' },
      {
        id: 'pdv.operacao.venda.discount',
        label: 'Pode aplicar desconto na venda',
      },
      { id: 'pdv.operacao.venda.cancel', label: 'Pode cancelar venda' },
      {
        id: 'pdv.operacao.venda.reprint',
        label: 'Pode reimprimir comprovante',
      },
    ],
  },
  {
    id: 'pdv.operacao.alcada',
    label: 'Alçada',
    items: [
      {
        id: PDV_ALCADA_AUTHORIZE_PERMISSION,
        label: 'Pode autorizar exceções de alçada',
      },
    ],
  },
]);

const PDV_CADASTROS_GROUP = group('pdv.cadastros', 'Cadastros de PDV', 'pdv', [
  crudSubgroup('pdv.cadastros.terminais', 'Terminais de PDV', [
    {
      id: 'pdv.cadastros.terminais.pair',
      label: 'Pode gerar código de pareamento',
    },
  ]),
  crudSubgroup('pdv.cadastros.caixas', 'Gerenciamento de caixas'),
  crudSubgroup('pdv.cadastros.kds', 'KDS'),
]);

export const ERP_PERMISSION_GROUPS: PermissionCatalogGroup[] = [
  VENDAS_GROUP,
  PRODUTOS_GROUP,
  ESTOQUE_GROUP,
  CLIENTES_GROUP,
  FINANCAS_GROUP,
  RELATORIOS_GROUP,
  DISPOSITIVOS_GROUP,
  CONFIGURACOES_GROUP,
];

export const PDV_PERMISSION_GROUPS: PermissionCatalogGroup[] = [
  PDV_OPERACAO_GROUP,
  PDV_CADASTROS_GROUP,
];

export function permissionGroupsByScope(
  scope: PermissionScope,
): PermissionCatalogGroup[] {
  return scope === 'pdv' ? PDV_PERMISSION_GROUPS : ERP_PERMISSION_GROUPS;
}

export function allPermissionItemIds(scope: PermissionScope): string[] {
  return permissionGroupsByScope(scope).flatMap((permissionGroup) =>
    permissionGroup.subgroups.flatMap((subgroup) =>
      subgroup.items.map((item) => item.id),
    ),
  );
}

export const ALL_PERMISSION_ITEM_IDS: readonly string[] = Object.freeze([
  ...allPermissionItemIds('erp'),
  ...allPermissionItemIds('pdv'),
]);

const ALL_PERMISSION_SET = new Set(ALL_PERMISSION_ITEM_IDS);

export function isValidPermissionId(id: string): boolean {
  return ALL_PERMISSION_SET.has(id);
}

export function assertPermissionIds(ids: readonly string[]): string[] {
  const invalid = ids.filter((id) => !ALL_PERMISSION_SET.has(id));
  if (invalid.length > 0) {
    throw new Error(
      `Permissões fora do catálogo: ${invalid.slice(0, 5).join(', ')}`,
    );
  }
  return [...ids];
}

export function getPermissionCatalog(): {
  groups: PermissionCatalogGroup[];
  allIds: readonly string[];
} {
  return {
    groups: [...ERP_PERMISSION_GROUPS, ...PDV_PERMISSION_GROUPS],
    allIds: ALL_PERMISSION_ITEM_IDS,
  };
}
