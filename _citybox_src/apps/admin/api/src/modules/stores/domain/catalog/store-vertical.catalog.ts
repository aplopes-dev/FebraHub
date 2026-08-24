import type { StoreVertical } from '../entities/store.entity';

export type ModuleCatalogItem = {
  moduleKey: string;
  label: string;
  description: string;
};

export type IntegrationCatalogItem = {
  integrationKey: string;
  label: string;
};

/**
 * Módulos do ERP Comércio. Eram `FOOD_MODULES` — seguem sendo os mesmos itens porque
 * os clientes de food migraram para o ERP Comércio junto com a vertical `'Food'`; o
 * que mudou foi só o nome da vertical dona deles.
 */
const COMERCIO_MODULES: ModuleCatalogItem[] = [
  {
    moduleKey: 'kds',
    label: 'KDS — Tela de Cozinha',
    description:
      'Exibe os pedidos em tempo real em uma tela dedicada na cozinha. Substitui a comunicação verbal entre caixa e preparo.',
  },
  {
    moduleKey: 'autoatendimento',
    label: 'Autoatendimento (Totem)',
    description:
      'Permite que o cliente faça pedidos por conta própria em um totem touchscreen, sem intervenção de atendente.',
  },
  {
    moduleKey: 'pdv_mobile',
    label: 'PDV Mobile (Comandas)',
    description:
      'Habilita o uso de tablets para anotar e enviar comandas diretamente da mesa do cliente para a cozinha.',
  },
];

const COMERCIO_INTEGRATIONS: IntegrationCatalogItem[] = [
  { integrationKey: 'ifood', label: 'iFood' },
  { integrationKey: 'stone', label: 'Gateway de Pagamento Stone' },
  { integrationKey: 'rappi', label: 'Rappi' },
];

const DEFAULT_MODULES: ModuleCatalogItem[] = [
  {
    moduleKey: 'catalogo',
    label: 'Catálogo',
    description: 'Gestão de produtos e categorias da loja.',
  },
];

const DEFAULT_INTEGRATIONS: IntegrationCatalogItem[] = [];

/** Slug canônico usado no ERP (`/{slug}`) e em `StoreUserAssignment.verticals`. */
const ERP_VERTICAL_SLUG: Record<StoreVertical, string> = {
  Comércio: 'comercio',
  Clínica: 'clinic',
  Imóveis: 'imoveis',
  Beautiful: 'beautiful',
};

const IMOVEIS_MODULES: ModuleCatalogItem[] = [
  {
    moduleKey: 'leads',
    label: 'Leads e CRM',
    description: 'Captação, funil e acompanhamento de clientes interessados.',
  },
  {
    moduleKey: 'properties',
    label: 'Imóveis',
    description: 'Cadastro de imóveis, fotos, documentos e publicação.',
  },
  {
    moduleKey: 'calendar',
    label: 'Agenda',
    description: 'Visitas, compromissos e lembretes da equipe.',
  },
  {
    moduleKey: 'transactions',
    label: 'Negócios',
    description: 'Propostas, negociações e comissões.',
  },
];

const BEAUTIFUL_MODULES: ModuleCatalogItem[] = [
  {
    moduleKey: 'agenda',
    label: 'Agenda',
    description: 'Agendamentos, profissionais e horários do salão.',
  },
  {
    moduleKey: 'clients',
    label: 'Clientes',
    description: 'Cadastro de clientes e categorias.',
  },
  {
    moduleKey: 'catalog',
    label: 'Catálogo',
    description: 'Serviços, produtos e estoque.',
  },
];

export function toErpVerticalSlug(vertical: StoreVertical | string): string {
  if (vertical in ERP_VERTICAL_SLUG) {
    return ERP_VERTICAL_SLUG[vertical as StoreVertical];
  }
  return vertical.trim().toLowerCase();
}

// `toKeycloakVerticalSlug` / `toKeycloakVerticalRole` saíram com o ADR C-16: as
// client roles `vertical.{slug}.view` do `citybox-backoffice` não existem mais.
// Com um realm por sistema, **estar no realm já é o gate de acesso** — não há
// role de "ver a vertical X" a atribuir, e o admin nem escreve mais no Keycloak
// das verticais.
//
// O mapa de slug legado (`Varejo → market`) já havia saído junto com a vertical
// `'Varejo'`.

export function getModuleCatalogForVertical(
  vertical: StoreVertical,
): ModuleCatalogItem[] {
  if (vertical === 'Comércio') return COMERCIO_MODULES;
  if (vertical === 'Imóveis') return IMOVEIS_MODULES;
  if (vertical === 'Beautiful') return BEAUTIFUL_MODULES;
  return DEFAULT_MODULES;
}

export function getIntegrationCatalogForVertical(
  vertical: StoreVertical,
): IntegrationCatalogItem[] {
  if (vertical === 'Comércio') return COMERCIO_INTEGRATIONS;
  return DEFAULT_INTEGRATIONS;
}

export function getModuleCatalogItem(
  vertical: StoreVertical,
  moduleKey: string,
): ModuleCatalogItem | undefined {
  return getModuleCatalogForVertical(vertical).find(
    (item) => item.moduleKey === moduleKey,
  );
}
