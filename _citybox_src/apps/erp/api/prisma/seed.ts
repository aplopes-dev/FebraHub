import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { applyErpSeedTemplate } from '../src/modules/store-setup/infrastructure/database/apply-erp-seed-template';
import { ERP_SEED_TEMPLATE } from '../src/modules/store-setup/application/seed-data/erp-seed-template';

/**
 * Seed do ambiente de desenvolvimento.
 *
 * Recria o cenário inteiro, não só o catálogo: uma organização com três
 * unidades, o responsável vinculado, produtos distribuídos pelas filiais e
 * fornecedores. Antes era preciso criar organização e unidades na mão pelo
 * Swagger para o app sair do zero.
 *
 * Dados de sistema (unidades de medida, estoque padrão, categorias de
 * movimentação, finanças, status de OS/contrato, …) vêm do
 * `ERP_SEED_TEMPLATE` via `applyErpSeedTemplate` — a mesma fonte que o
 * provisionamento em runtime. Este arquivo só acrescenta dados de demo
 * (produtos, clientes, fornecedores, …).
 *
 * Idempotente: tudo por `upsert` em chave natural.
 *
 * O responsável é resolvido no Keycloak por e-mail, porque o vínculo depende do
 * `sub` — a chave entre a identidade e o `User` local. Sem as credenciais de
 * Admin API configuradas, o seed grava os dados de negócio e avisa.
 */
const ORGANIZATION_DOCUMENT =
  process.env.SEED_ORGANIZATION_DOCUMENT?.trim() || '11222444000198';
const ORGANIZATION_LEGAL_NAME =
  process.env.SEED_ORGANIZATION_LEGAL_NAME?.trim() || 'Lojista Comercio LTDA';
const ORGANIZATION_TRADE_NAME =
  process.env.SEED_ORGANIZATION_TRADE_NAME?.trim() || 'Loja do Lojista';
const OWNER_EMAIL =
  process.env.SEED_OWNER_EMAIL?.trim() || 'lojista@citybox.com';

const BRANCHES = [
  { code: '001', document: '11222445000132', tradeName: 'Matriz Centro', isHeadquarters: true, city: 'Ilhéus', state: 'BA' },
  { code: '002', document: '11222446000187', tradeName: 'Filial Pontal', isHeadquarters: false, city: 'Ilhéus', state: 'BA' },
  { code: '003', document: '11222447000121', tradeName: 'Filial Itabuna', isHeadquarters: false, city: 'Itabuna', state: 'BA' },
] as const;

/** Categorias de demo dos produtos — além da `Geral` provisionada pelo template. */
const CATEGORIES = [
  'Acessórios',
  'Calçados',
  'Casa',
  'Insumos',
  'Vestuário',
] as const;

const ALL_BRANCHES = ['001', '002', '003'];

type SeedProduct = {
  name: string;
  sku: string;
  category: (typeof CATEGORIES)[number];
  priceReais: number;
  type: 'simple' | 'collection' | 'supply';
  unit: string;
  /**
   * Códigos das unidades onde o produto opera. Vazio = existe no cadastro da
   * empresa, mas em nenhuma filial — o caso dos descontinuados.
   */
  branches: string[];
  hasVariants?: boolean;
  variantsCount?: number;
  imageUrl?: string;
  deletedAt?: string;
};

const PRODUCTS: SeedProduct[] = [
  { name: 'Camiseta Básica Algodão', sku: 'CAM-BAS-001', category: 'Vestuário', priceReais: 59.9, type: 'simple', unit: 'un', branches: ALL_BRANCHES, hasVariants: true, variantsCount: 6, imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Cam' },
  { name: 'Calça Jeans Slim', sku: 'CAL-JNS-002', category: 'Vestuário', priceReais: 149.9, type: 'simple', unit: 'un', branches: ALL_BRANCHES, hasVariants: true, variantsCount: 8, imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Cal' },
  { name: 'Kit Casa Cozinha', sku: 'KIT-CASA-003', category: 'Casa', priceReais: 289.0, type: 'collection', unit: 'cx', branches: ['001', '002'] },
  { name: 'Farinha de Trigo Especial', sku: 'INS-FAR-004', category: 'Insumos', priceReais: 12.5, type: 'supply', unit: 'kg', branches: ['001'] },
  { name: 'Óleo de Soja 900ml', sku: 'INS-OLE-005', category: 'Insumos', priceReais: 8.9, type: 'supply', unit: 'ml', branches: ['001'] },
  { name: 'Tênis Casual Urbano', sku: 'TEN-URB-006', category: 'Calçados', priceReais: 219.9, type: 'simple', unit: 'un', branches: ALL_BRANCHES, hasVariants: true, variantsCount: 10, imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Ten' },
  { name: 'Panela Antiaderente 24cm', sku: 'PAN-ANT-007', category: 'Casa', priceReais: 99.0, type: 'simple', unit: 'un', branches: ['001', '003'], imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Pan' },
  { name: 'Vestido Floral Verão', sku: 'VES-FLO-008', category: 'Vestuário', priceReais: 179.9, type: 'simple', unit: 'un', branches: ['001', '002'], hasVariants: true, variantsCount: 4, imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Ves' },
  { name: 'Queijo Mussarela Fatiado', sku: 'INS-QUE-009', category: 'Insumos', priceReais: 42.0, type: 'supply', unit: 'kg', branches: ['001'] },
  { name: 'Coleção Mesa Posta', sku: 'COL-MES-010', category: 'Casa', priceReais: 450.0, type: 'collection', unit: 'cx', branches: ['001'], imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Col' },
  { name: 'Boné Aba Reta', sku: 'BON-ABA-011', category: 'Acessórios', priceReais: 69.9, type: 'simple', unit: 'un', branches: ALL_BRANCHES, hasVariants: true, variantsCount: 3, imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Bon' },
  { name: 'Meia Esportiva (par)', sku: 'MEI-ESP-012', category: 'Acessórios', priceReais: 24.9, type: 'simple', unit: 'pct', branches: ['002', '003'] },
  { name: 'Produto descontinuado A', sku: 'OLD-A-013', category: 'Vestuário', priceReais: 39.9, type: 'simple', unit: 'un', branches: [], deletedAt: '2026-06-01T12:00:00.000Z' },
  { name: 'Insumo antigo - Açúcar', sku: 'OLD-INS-014', category: 'Insumos', priceReais: 5.5, type: 'supply', unit: 'kg', branches: [], deletedAt: '2026-05-15T12:00:00.000Z' },
  { name: 'Jaqueta Corta-vento', sku: 'JAQ-CV-015', category: 'Vestuário', priceReais: 259.9, type: 'simple', unit: 'un', branches: ['001', '003'], hasVariants: true, variantsCount: 5, imageUrl: 'https://placehold.co/80x80/e2e8f0/64748b?text=Jaq' },
];

const SUPPLIERS = [
  { personType: 'PJ' as const, name: 'Distribuidora Bahia', legalName: 'Distribuidora Bahia Alimentos LTDA', document: '11222448000176', email: 'contato@distribuidorabahia.com.br', city: 'Ilhéus', state: 'BA', branches: ALL_BRANCHES },
  { personType: 'PJ' as const, name: 'Atacado Ilhéus', legalName: 'Atacado Ilhéus Comercio LTDA', document: '11222449000110', email: 'compras@atacadoilheus.com.br', city: 'Ilhéus', state: 'BA', branches: ['001', '002'] },
  { personType: 'PF' as const, name: 'José Embalagens', legalName: null, document: '52998224725', email: 'jose@embalagenslitoral.com.br', city: 'Itabuna', state: 'BA', branches: ['003'] },
];

const CUSTOMER_CATEGORIES = [
  { name: 'VIP', discountPercentage: 10 },
  { name: 'Atacado', discountPercentage: 5 },
] as const;

/** CPFs/CNPJs válidos distintos dos fornecedores/transportadoras. */
const CUSTOMERS = [
  {
    personType: 'PF' as const,
    name: 'Maria Silva',
    document: '15350946056',
    email: 'maria.silva@email.com',
    mobilePhone: '73999110011',
    stage: 'lead' as const,
    category: 'VIP' as const,
    branches: ALL_BRANCHES,
    addresses: [
      {
        addressType: 'principal' as const,
        zipCode: '45650100',
        street: 'Av. Soares',
        number: '120',
        district: 'Centro',
        city: 'Ilhéus',
        state: 'BA',
      },
    ],
  },
  {
    personType: 'PF' as const,
    name: 'João Pereira',
    document: '11144477735',
    email: 'joao.pereira@email.com',
    mobilePhone: '73999220022',
    stage: 'opportunity' as const,
    category: 'Atacado' as const,
    branches: ['001', '002'],
    addresses: [],
  },
  {
    personType: 'PJ' as const,
    name: 'Comércio Pontal',
    document: '11222400020002',
    email: 'contato@comerciopontal.com.br',
    mobilePhone: '7332334455',
    stage: 'active' as const,
    category: 'VIP' as const,
    branches: ['001'],
    addresses: [
      {
        addressType: 'principal' as const,
        zipCode: '45654000',
        street: 'Rua das Flores',
        number: '45',
        district: 'Pontal',
        city: 'Ilhéus',
        state: 'BA',
      },
      {
        addressType: 'entrega' as const,
        zipCode: '45654001',
        street: 'Rua do Porto',
        number: '8',
        district: 'Pontal',
        city: 'Ilhéus',
        state: 'BA',
      },
    ],
  },
  {
    personType: 'PF' as const,
    name: 'Carla Inativa',
    document: null as string | null,
    email: 'carla@email.com',
    mobilePhone: '73999330033',
    stage: 'inactive' as const,
    category: null as string | null,
    branches: ['003'],
    addresses: [],
  },
];

/** Documentos válidos (DV) distintos dos fornecedores. */
const CARRIERS = [
  {
    personType: 'PJ' as const,
    deliveryType: 'transportadora' as const,
    name: 'Transportadora Rápida',
    legalName: 'Rápida Logística e Transportes LTDA',
    document: '11222451000190',
    email: 'contato@rapida.com.br',
    city: 'Ilhéus',
    state: 'BA',
    stateRegistration: '123456789',
    branches: ['001'],
    deletedAt: null as Date | null,
  },
  {
    personType: 'PF' as const,
    deliveryType: 'entregador' as const,
    name: 'João Motoboy',
    legalName: 'João da Silva',
    document: '39053344705',
    email: 'joao.entregas@email.com',
    city: 'Ilhéus',
    state: 'BA',
    stateRegistration: null as string | null,
    branches: ['001', '002'],
    deletedAt: null as Date | null,
  },
  {
    personType: 'PJ' as const,
    deliveryType: 'transportadora' as const,
    name: 'Expresso Bahia',
    legalName: 'Expresso Bahia Transportes S.A.',
    document: '11222363000198',
    email: 'sac@expressobahia.com.br',
    city: 'Salvador',
    state: 'BA',
    stateRegistration: null as string | null,
    icmsExempt: true,
    branches: ['003'],
    deletedAt: new Date('2025-12-15T10:00:00.000Z'),
  },
];

function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Resolve o `sub` do responsável no Keycloak, para amarrar o vínculo. */
async function findOwnerKeycloakSub(): Promise<string | null> {
  const issuer = process.env.KEYCLOAK_ISSUER?.trim();
  const clientId = process.env.KEYCLOAK_PROVISIONING_CLIENT_ID?.trim();
  const clientSecret = process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret) return null;

  const parsed = issuer.match(/^(.*)\/realms\/([^/]+)$/);
  if (!parsed) return null;
  const serverUrl = parsed[1];
  const realm = parsed[2];

  try {
    const tokenRes = await fetch(
      `${serverUrl}/realms/${realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!tokenRes.ok) return null;
    const token = (await tokenRes.json()) as { access_token: string };

    const usersRes = await fetch(
      `${serverUrl}/admin/realms/${realm}/users?email=${encodeURIComponent(OWNER_EMAIL)}&exact=true`,
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!usersRes.ok) return null;
    const users = (await usersRes.json()) as Array<{ id?: string }>;
    return users[0]?.id ?? null;
  } catch {
    // Keycloak fora do ar não impede semear os dados de negócio.
    return null;
  }
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const now = () => new Date();

  console.log(`Seed — organização "${ORGANIZATION_TRADE_NAME}"`);

  const organization = await prisma.organization.upsert({
    where: { document: ORGANIZATION_DOCUMENT },
    create: {
      personType: 'PJ',
      document: ORGANIZATION_DOCUMENT,
      legalName: ORGANIZATION_LEGAL_NAME,
      tradeName: ORGANIZATION_TRADE_NAME,
      email: OWNER_EMAIL,
      responsibleName: 'Responsável de desenvolvimento',
      updatedAt: now(),
    },
    update: { updatedAt: now() },
  });
  const organizationId = organization.id;

  const branchIdByCode = new Map<string, string>();
  for (const branch of BRANCHES) {
    const row = await prisma.branch.upsert({
      where: { organizationId_code: { organizationId, code: branch.code } },
      create: {
        organizationId,
        code: branch.code,
        personType: 'PJ',
        document: branch.document,
        legalName: `${ORGANIZATION_LEGAL_NAME} - ${branch.tradeName}`,
        tradeName: branch.tradeName,
        isHeadquarters: branch.isHeadquarters,
        city: branch.city,
        state: branch.state,
        updatedAt: now(),
      },
      update: { updatedAt: now() },
    });
    branchIdByCode.set(branch.code, row.id);
  }
  console.log(`  unidades: ${branchIdByCode.size}`);

  const ownerSub = await findOwnerKeycloakSub();
  let ownerUserId: string | null = null;
  if (ownerSub) {
    const user = await prisma.user.upsert({
      where: { keycloakSub: ownerSub },
      create: { keycloakSub: ownerSub, email: OWNER_EMAIL, updatedAt: now() },
      update: { email: OWNER_EMAIL, updatedAt: now() },
    });
    ownerUserId = user.id;
    await prisma.membership.upsert({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      create: {
        organizationId,
        userId: user.id,
        role: 'OWNER',
        updatedAt: now(),
      },
      update: { role: 'OWNER', active: true, updatedAt: now() },
    });
    console.log(`  responsável: ${OWNER_EMAIL} (OWNER)`);
  } else {
    console.warn(
      `  ⚠️  responsável NÃO vinculado — confira KEYCLOAK_PROVISIONING_CLIENT_ID/SECRET e se ${OWNER_EMAIL} existe no realm citybox-erp.`,
    );
  }

  const systemData = await applyErpSeedTemplate(prisma, organizationId);
  console.log(
    `  dados de sistema (template v${systemData.version}): ` +
      `${ERP_SEED_TEMPLATE.unitsOfMeasure.length} unidades · ` +
      `${ERP_SEED_TEMPLATE.productCategories.length} categorias · ` +
      `${ERP_SEED_TEMPLATE.stocks.length} estoques · ` +
      `${ERP_SEED_TEMPLATE.movementCategories.length} categorias de movimentação · ` +
      `${ERP_SEED_TEMPLATE.financialGroups.length} grupos financeiros · ` +
      `${ERP_SEED_TEMPLATE.chartOfAccounts.length} contas · ` +
      `${ERP_SEED_TEMPLATE.costCenters.length} centros de custo`,
  );

  // Categorias extras só para o catálogo de demonstração (não são isSystem).
  const categoryIdByName = new Map<string, string>();
  for (const name of CATEGORIES) {
    const category = await prisma.productCategory.upsert({
      where: { organizationId_name: { organizationId, name } },
      // `updatedAt` explícito: com `update: {}` vazio o Prisma não preenche o
      // campo `@updatedAt` e o INSERT viola o NOT NULL da coluna.
      create: { organizationId, name, updatedAt: now() },
      update: { updatedAt: now() },
    });
    categoryIdByName.set(name, category.id);
  }
  console.log(`  categorias de demo: ${categoryIdByName.size}`);

  const unitIdByAbbreviation = new Map(
    (
      await prisma.unitOfMeasure.findMany({
        where: { organizationId },
        select: { id: true, abbreviation: true },
      })
    ).map((row) => [row.abbreviation, row.id] as const),
  );
  console.log(`  unidades de medida: ${unitIdByAbbreviation.size}`);

  let productBranchLinks = 0;
  for (const product of PRODUCTS) {
    const categoryId = categoryIdByName.get(product.category);
    if (!categoryId) throw new Error(`Categoria ausente: ${product.category}`);

    const data = {
      organizationId,
      name: product.name,
      categoryId,
      unitOfMeasureId: unitIdByAbbreviation.get(product.unit) ?? null,
      type: product.type,
      basePriceCents: toCents(product.priceReais),
      imageUrl: product.imageUrl ?? null,
      trackStock: true,
      barcodes: [] as string[],
      hasVariants: product.hasVariants ?? false,
      variantsCount: product.variantsCount ?? 0,
      deletedAt: product.deletedAt ? new Date(product.deletedAt) : null,
      updatedAt: now(),
    };

    const row = await prisma.product.upsert({
      where: { organizationId_sku: { organizationId, sku: product.sku } },
      create: { sku: product.sku, ...data },
      update: data,
    });

    for (const code of product.branches) {
      const branchId = branchIdByCode.get(code);
      if (!branchId) continue;
      await prisma.productBranch.upsert({
        where: { productId_branchId: { productId: row.id, branchId } },
        create: {
          organizationId,
          productId: row.id,
          branchId,
          updatedAt: now(),
        },
        update: { updatedAt: now() },
      });
      productBranchLinks += 1;
    }
  }
  console.log(
    `  produtos: ${PRODUCTS.length} (${productBranchLinks} vínculos com unidades)`,
  );

  for (const supplier of SUPPLIERS) {
    const row = await prisma.supplier.upsert({
      where: {
        organizationId_document: { organizationId, document: supplier.document },
      },
      create: {
        organizationId,
        personType: supplier.personType,
        name: supplier.name,
        legalName: supplier.legalName,
        document: supplier.document,
        email: supplier.email,
        city: supplier.city,
        state: supplier.state,
        updatedAt: now(),
      },
      update: { updatedAt: now() },
    });

    for (const code of supplier.branches) {
      const branchId = branchIdByCode.get(code);
      if (!branchId) continue;
      await prisma.supplierBranch.upsert({
        where: { supplierId_branchId: { supplierId: row.id, branchId } },
        create: { organizationId, supplierId: row.id, branchId },
        update: {},
      });
    }
  }
  console.log(`  fornecedores: ${SUPPLIERS.length}`);

  const customerCategoryIdByName = new Map<string, string>();
  for (const category of CUSTOMER_CATEGORIES) {
    const row = await prisma.customerCategory.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name: category.name,
        },
      },
      create: {
        organizationId,
        name: category.name,
        discountPercentage: category.discountPercentage,
        updatedAt: now(),
      },
      update: {
        discountPercentage: category.discountPercentage,
        updatedAt: now(),
      },
    });
    customerCategoryIdByName.set(category.name, row.id);
  }
  console.log(`  categorias de cliente: ${CUSTOMER_CATEGORIES.length}`);

  for (const customer of CUSTOMERS) {
    const categoryId = customer.category
      ? customerCategoryIdByName.get(customer.category) ?? null
      : null;

    let row;
    if (customer.document) {
      row = await prisma.customer.upsert({
        where: {
          organizationId_document: {
            organizationId,
            document: customer.document,
          },
        },
        create: {
          organizationId,
          personType: customer.personType,
          name: customer.name,
          document: customer.document,
          email: customer.email,
          mobilePhone: customer.mobilePhone,
          stage: customer.stage,
          categoryId,
          updatedAt: now(),
        },
        update: {
          name: customer.name,
          email: customer.email,
          mobilePhone: customer.mobilePhone,
          stage: customer.stage,
          categoryId,
          updatedAt: now(),
        },
      });
    } else {
      // Sem documento: upsert por e-mail (seed idempotente sem unique de doc).
      const existing = await prisma.customer.findFirst({
        where: {
          organizationId,
          email: customer.email,
          document: null,
        },
      });
      row = existing
        ? await prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: customer.name,
              mobilePhone: customer.mobilePhone,
              stage: customer.stage,
              categoryId,
              updatedAt: now(),
            },
          })
        : await prisma.customer.create({
            data: {
              organizationId,
              personType: customer.personType,
              name: customer.name,
              document: null,
              email: customer.email,
              mobilePhone: customer.mobilePhone,
              stage: customer.stage,
              categoryId,
              updatedAt: now(),
            },
          });
    }

    await prisma.customerAddress.deleteMany({
      where: { customerId: row.id, organizationId },
    });
    if (customer.addresses.length > 0) {
      await prisma.customerAddress.createMany({
        data: customer.addresses.map((address) => ({
          organizationId,
          customerId: row.id,
          addressType: address.addressType,
          zipCode: address.zipCode,
          street: address.street,
          number: address.number,
          district: address.district,
          city: address.city,
          state: address.state,
        })),
      });
    }

    await prisma.customerBranch.deleteMany({
      where: { customerId: row.id, organizationId },
    });
    for (const code of customer.branches) {
      const branchId = branchIdByCode.get(code);
      if (!branchId) continue;
      await prisma.customerBranch.create({
        data: { organizationId, customerId: row.id, branchId },
      });
    }
  }
  console.log(`  clientes: ${CUSTOMERS.length}`);

  for (const carrier of CARRIERS) {
    const row = await prisma.carrier.upsert({
      where: {
        organizationId_document: { organizationId, document: carrier.document },
      },
      create: {
        organizationId,
        personType: carrier.personType,
        deliveryType: carrier.deliveryType,
        name: carrier.name,
        legalName: carrier.legalName,
        document: carrier.document,
        email: carrier.email,
        city: carrier.city,
        state: carrier.state,
        stateRegistration: carrier.stateRegistration,
        icmsExempt: 'icmsExempt' in carrier ? Boolean(carrier.icmsExempt) : false,
        deletedAt: carrier.deletedAt,
        updatedAt: now(),
      },
      update: {
        deletedAt: carrier.deletedAt,
        updatedAt: now(),
      },
    });

    for (const code of carrier.branches) {
      const branchId = branchIdByCode.get(code);
      if (!branchId) continue;
      await prisma.carrierBranch.upsert({
        where: { carrierId_branchId: { carrierId: row.id, branchId } },
        create: { organizationId, carrierId: row.id, branchId },
        update: {},
      });
    }
  }
  console.log(`  transportadoras: ${CARRIERS.length}`);

  const productIdBySku = new Map(
    (
      await prisma.product.findMany({
        where: { organizationId },
        select: { id: true, sku: true },
      })
    ).map((row) => [row.sku, row.id] as const),
  );

  type SeedPriceList = {
    name: string;
    adjustmentType: 'manual' | 'percent_markup' | 'percent_discount' | 'fixed_over_base';
    adjustmentValue: number;
    channels: string[];
    startDate: string | null;
    endDate: string | null;
    active: boolean;
    priority: number;
    items: Array<{ sku: string; priceReais: number }>;
  };

  const PRICE_LISTS: SeedPriceList[] = [
    {
      name: 'Padrão',
      adjustmentType: 'manual',
      adjustmentValue: 0,
      channels: ['pdv', 'delivery', 'marketplace', 'cardapio'],
      startDate: null,
      endDate: null,
      active: true,
      priority: 0,
      items: [
        { sku: 'CAM-BAS-001', priceReais: 59.9 },
        { sku: 'CAL-JNS-002', priceReais: 149.9 },
        { sku: 'TEN-URB-006', priceReais: 219.9 },
        { sku: 'PAN-ANT-007', priceReais: 99.0 },
      ],
    },
    {
      name: 'Atacado',
      adjustmentType: 'percent_discount',
      adjustmentValue: 15,
      channels: ['pdv', 'marketplace'],
      startDate: null,
      endDate: null,
      active: true,
      priority: 1,
      items: [
        { sku: 'CAM-BAS-001', priceReais: 50.92 },
        { sku: 'CAL-JNS-002', priceReais: 127.42 },
        { sku: 'MEI-ESP-012', priceReais: 21.17 },
      ],
    },
    {
      name: 'Promoção',
      adjustmentType: 'percent_discount',
      adjustmentValue: 20,
      channels: ['pdv', 'delivery', 'cardapio'],
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.000Z',
      active: true,
      priority: 2,
      items: [
        { sku: 'VES-FLO-008', priceReais: 143.92 },
        { sku: 'JAQ-CV-015', priceReais: 207.92 },
      ],
    },
    {
      name: 'VIP',
      adjustmentType: 'percent_discount',
      adjustmentValue: 10,
      channels: ['pdv'],
      startDate: null,
      endDate: null,
      active: true,
      priority: 3,
      items: [],
    },
    {
      name: 'Black Friday',
      adjustmentType: 'percent_discount',
      adjustmentValue: 30,
      channels: ['pdv', 'marketplace', 'cardapio'],
      startDate: '2026-11-27T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.000Z',
      active: false,
      priority: 4,
      items: [
        { sku: 'CAM-BAS-001', priceReais: 41.93 },
        { sku: 'TEN-URB-006', priceReais: 153.93 },
        { sku: 'VES-FLO-008', priceReais: 125.93 },
      ],
    },
  ];

  let priceListItemCount = 0;
  for (const list of PRICE_LISTS) {
    const row = await prisma.priceList.upsert({
      where: {
        organizationId_name: { organizationId, name: list.name },
      },
      create: {
        organizationId,
        name: list.name,
        adjustmentType: list.adjustmentType,
        adjustmentValue: list.adjustmentValue,
        channels: list.channels,
        startDate: list.startDate ? new Date(list.startDate) : null,
        endDate: list.endDate ? new Date(list.endDate) : null,
        active: list.active,
        priority: list.priority,
        updatedAt: now(),
      },
      update: {
        adjustmentType: list.adjustmentType,
        adjustmentValue: list.adjustmentValue,
        channels: list.channels,
        startDate: list.startDate ? new Date(list.startDate) : null,
        endDate: list.endDate ? new Date(list.endDate) : null,
        active: list.active,
        priority: list.priority,
        updatedAt: now(),
      },
    });

    await prisma.priceListItem.deleteMany({
      where: { organizationId, priceListId: row.id },
    });

    for (const item of list.items) {
      const productId = productIdBySku.get(item.sku);
      if (!productId) continue;
      await prisma.priceListItem.create({
        data: {
          organizationId,
          priceListId: row.id,
          productId,
          priceCents: toCents(item.priceReais),
          updatedAt: now(),
        },
      });
      priceListItemCount += 1;
    }
  }
  console.log(
    `  listas de preço: ${PRICE_LISTS.length} (${priceListItemCount} itens)`,
  );

  // Parâmetros fiscais: ~metade dos produtos "configurados"; restante pendente.
  const allProducts = await prisma.product.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true, sku: true },
    orderBy: { sku: 'asc' },
  });
  const mainBranchId = branchIdByCode.get('001') ?? [...branchIdByCode.values()][0];
  const configuredSkus = new Set(
    allProducts.filter((_, index) => index % 2 === 0).map((p) => p.sku),
  );

  let fiscalConfigured = 0;
  let fiscalOverrides = 0;
  for (const product of allProducts) {
    if (!configuredSkus.has(product.sku)) {
      await prisma.productFiscalBranch.deleteMany({
        where: { organizationId, productId: product.id },
      });
      await prisma.productFiscal.deleteMany({
        where: { organizationId, productId: product.id },
      });
      continue;
    }

    const fiscal = await prisma.productFiscal.upsert({
      where: { productId: product.id },
      create: {
        organizationId,
        productId: product.id,
        ncm: '61091000',
        origin: '0',
        netWeightKg: 0.25,
        grossWeightKg: 0.3,
        cest: '',
        fcpPercent: 2,
        fcpStPercent: 0,
        fcpStRetainedPercent: 0,
        cstIbsCbs: '',
        taxClassification: 'mercadoria_revenda',
        icms: '00',
        icmsApplyToAll: true,
        pisCofins: '01',
        pisCofinsApplyToAll: true,
        ipi: '99',
        ipiApplyToAll: true,
        cfop: '5102',
        cfopApplyToAll: fiscalConfigured % 3 !== 0,
        updatedAt: now(),
      },
      update: {
        ncm: '61091000',
        origin: '0',
        netWeightKg: 0.25,
        grossWeightKg: 0.3,
        taxClassification: 'mercadoria_revenda',
        icms: '00',
        pisCofins: '01',
        ipi: '99',
        cfop: '5102',
        cfopApplyToAll: fiscalConfigured % 3 !== 0,
        updatedAt: now(),
      },
    });
    fiscalConfigured += 1;

    await prisma.productFiscalBranch.deleteMany({
      where: { organizationId, productFiscalId: fiscal.id },
    });

    if (!fiscal.cfopApplyToAll && mainBranchId) {
      await prisma.productFiscalBranch.create({
        data: {
          organizationId,
          productFiscalId: fiscal.id,
          productId: product.id,
          branchId: mainBranchId,
          icms: '00',
          pisCofins: '01',
          ipi: '99',
          cfop: '5405',
          updatedAt: now(),
        },
      });
      fiscalOverrides += 1;
    }
  }
  console.log(
    `  parâmetros fiscais: ${fiscalConfigured} configurados, ${fiscalOverrides} overrides por unidade`,
  );

  // Fichas técnicas: kit (processo produtivo) + camiseta (produção automática).
  const supplyIds = {
    farinha: productIdBySku.get('INS-FAR-004'),
    oleo: productIdBySku.get('INS-OLE-005'),
    queijo: productIdBySku.get('INS-QUE-009'),
  };
  const sheetSpecs: Array<{
    sku: string;
    productionType: 'automatic' | 'productive_process';
    markupPercent: number;
    components: Array<{ sku: keyof typeof supplyIds; quantity: number; optional: boolean }>;
  }> = [
    {
      sku: 'KIT-CASA-003',
      productionType: 'productive_process',
      markupPercent: 80,
      components: [
        { sku: 'farinha', quantity: 0.5, optional: false },
        { sku: 'oleo', quantity: 50, optional: false },
      ],
    },
    {
      sku: 'CAM-BAS-001',
      productionType: 'automatic',
      markupPercent: 100,
      components: [
        { sku: 'queijo', quantity: 0.1, optional: true },
        { sku: 'farinha', quantity: 0.05, optional: false },
      ],
    },
  ];

  let technicalSheetCount = 0;
  for (const spec of sheetSpecs) {
    const productId = productIdBySku.get(spec.sku);
    if (!productId) continue;
    const lines = spec.components
      .map((line, index) => {
        const componentProductId = supplyIds[line.sku];
        if (!componentProductId) return null;
        return {
          componentProductId,
          quantity: line.quantity,
          optional: line.optional,
          sortOrder: index,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
    if (lines.length === 0) continue;

    const sheet = await prisma.technicalSheet.upsert({
      where: { productId },
      create: {
        organizationId,
        productId,
        productionType: spec.productionType,
        maxRemovableComponents: lines.filter((line) => line.optional).length,
        markupPercent: spec.markupPercent,
        updatedAt: now(),
      },
      update: {
        productionType: spec.productionType,
        maxRemovableComponents: lines.filter((line) => line.optional).length,
        markupPercent: spec.markupPercent,
        updatedAt: now(),
      },
    });

    await prisma.technicalSheetComponent.deleteMany({
      where: { organizationId, technicalSheetId: sheet.id },
    });
    await prisma.technicalSheetOptionComponent.deleteMany({
      where: { organizationId, technicalSheetId: sheet.id },
    });

    for (const line of lines) {
      await prisma.technicalSheetComponent.create({
        data: {
          organizationId,
          technicalSheetId: sheet.id,
          componentProductId: line.componentProductId,
          optional: line.optional,
          quantity: line.quantity,
          sortOrder: line.sortOrder,
          updatedAt: now(),
        },
      });
    }
    technicalSheetCount += 1;
  }
  console.log(`  fichas técnicas: ${technicalSheetCount}`);

  // Ordens de produção demo (KIT-CASA-003 = productive_process).
  const kitProductId = productIdBySku.get('KIT-CASA-003');
  const defaultStock = await prisma.stock.findFirst({
    where: {
      organizationId,
      OR: [{ systemKey: 'principal' }, { isDefault: true }],
    },
    select: { id: true },
  });
  if (!defaultStock) {
    throw new Error(
      'Estoque padrão ausente após applyErpSeedTemplate — o template deveria ter criado systemKey=principal.',
    );
  }
  const productionSourceStockId = defaultStock.id;
  const secondStock = await prisma.stock.findFirst({
    where: {
      organizationId,
      id: { not: defaultStock.id },
    },
    select: { id: true },
  });
  let productionOrderCount = 0;
  if (kitProductId && ownerUserId) {
    const sourceId = productionSourceStockId;
    const destId = secondStock?.id ?? productionSourceStockId;
    const expected = new Date();
    expected.setUTCDate(expected.getUTCDate() + 3);

    const pending = await prisma.productionOrder.upsert({
      where: { id: 'seed-prod-pending-kit' },
      create: {
        id: 'seed-prod-pending-kit',
        organizationId,
        productId: kitProductId,
        plannedQuantity: 10,
        sourceStockId: sourceId,
        destinationStockId: destId,
        expectedDate: expected,
        status: 'pending',
        createdByUserId: ownerUserId,
        updatedAt: now(),
      },
      update: {
        plannedQuantity: 10,
        status: 'pending',
        updatedAt: now(),
      },
    });
    productionOrderCount += 1;

    const startedAt = new Date();
    await prisma.productionOrder.upsert({
      where: { id: 'seed-prod-progress-kit' },
      create: {
        id: 'seed-prod-progress-kit',
        organizationId,
        productId: kitProductId,
        plannedQuantity: 5,
        sourceStockId: sourceId,
        destinationStockId: destId,
        expectedDate: expected,
        status: 'in_progress',
        startedAt,
        createdByUserId: ownerUserId,
        updatedAt: now(),
      },
      update: {
        plannedQuantity: 5,
        status: 'in_progress',
        startedAt,
        updatedAt: now(),
      },
    });
    productionOrderCount += 1;

    await prisma.productionHistoryEntry.deleteMany({
      where: {
        organizationId,
        productionOrderId: { in: [pending.id, 'seed-prod-progress-kit'] },
      },
    });
    await prisma.productionHistoryEntry.createMany({
      data: [
        {
          organizationId,
          productionOrderId: pending.id,
          kind: 'system',
          title: 'Pedido criado',
          userName: 'Seed',
        },
        {
          organizationId,
          productionOrderId: 'seed-prod-progress-kit',
          kind: 'system',
          title: 'Pedido criado',
          userName: 'Seed',
        },
        {
          organizationId,
          productionOrderId: 'seed-prod-progress-kit',
          kind: 'system',
          title: 'Produção iniciada',
          userName: 'Seed',
        },
      ],
    });
  }
  console.log(`  ordens de produção: ${productionOrderCount}`);

  // --- Finanças: grupos, plano de contas, centros de custo ---
  const FINANCIAL_GROUPS: Array<{
    id: string;
    name: string;
    type: 'receita' | 'despesa';
  }> = [
    { id: 'seed-fg-receitas', name: 'Receitas', type: 'receita' },
    { id: 'seed-fg-outras-receitas', name: 'Outras receitas', type: 'receita' },
    { id: 'seed-fg-despesas', name: 'Despesas', type: 'despesa' },
    { id: 'seed-fg-custos', name: 'Custos', type: 'despesa' },
    { id: 'seed-fg-caixa', name: 'Caixa e bancos', type: 'receita' },
    { id: 'seed-fg-ativo', name: 'Ativo', type: 'receita' },
  ];

  for (const group of FINANCIAL_GROUPS) {
    await prisma.financialGroup.upsert({
      where: { id: group.id },
      create: {
        id: group.id,
        organizationId,
        name: group.name,
        type: group.type,
        updatedAt: now(),
      },
      update: { name: group.name, type: group.type, updatedAt: now() },
    });
  }
  console.log(`  grupos financeiros: ${FINANCIAL_GROUPS.length}`);

  const CHART_OF_ACCOUNTS: Array<{
    id: string;
    name: string;
    financialGroupId: string;
    availableForPdv: boolean;
  }> = [
    {
      id: 'seed-coa-vendas',
      name: 'Vendas de mercadorias',
      financialGroupId: 'seed-fg-receitas',
      availableForPdv: true,
    },
    {
      id: 'seed-coa-servicos',
      name: 'Prestação de serviços',
      financialGroupId: 'seed-fg-receitas',
      availableForPdv: true,
    },
    {
      id: 'seed-coa-outras',
      name: 'Outras receitas',
      financialGroupId: 'seed-fg-outras-receitas',
      availableForPdv: false,
    },
    {
      id: 'seed-coa-cmv',
      name: 'Custo das mercadorias vendidas',
      financialGroupId: 'seed-fg-custos',
      availableForPdv: false,
    },
    {
      id: 'seed-coa-pessoal',
      name: 'Despesas com pessoal',
      financialGroupId: 'seed-fg-despesas',
      availableForPdv: false,
    },
    {
      id: 'seed-coa-admin',
      name: 'Despesas administrativas',
      financialGroupId: 'seed-fg-despesas',
      availableForPdv: false,
    },
    {
      id: 'seed-coa-sangria',
      name: 'Sangria de caixa',
      financialGroupId: 'seed-fg-caixa',
      availableForPdv: true,
    },
    {
      id: 'seed-coa-suprimento',
      name: 'Suprimento de caixa',
      financialGroupId: 'seed-fg-caixa',
      availableForPdv: true,
    },
    {
      id: 'seed-coa-recebimento',
      name: 'Recebimento de clientes',
      financialGroupId: 'seed-fg-ativo',
      availableForPdv: true,
    },
  ];

  for (const account of CHART_OF_ACCOUNTS) {
    await prisma.chartOfAccount.upsert({
      where: { id: account.id },
      create: {
        id: account.id,
        organizationId,
        name: account.name,
        financialGroupId: account.financialGroupId,
        availableForPdv: account.availableForPdv,
        updatedAt: now(),
      },
      update: {
        name: account.name,
        financialGroupId: account.financialGroupId,
        availableForPdv: account.availableForPdv,
        updatedAt: now(),
      },
    });
  }
  console.log(`  plano de contas: ${CHART_OF_ACCOUNTS.length}`);

  const COST_CENTERS = [
    { id: 'seed-cc-administrativo', name: 'Administrativo' },
    { id: 'seed-cc-comercial', name: 'Comercial' },
    { id: 'seed-cc-financeiro', name: 'Financeiro' },
    { id: 'seed-cc-operacional', name: 'Operacional' },
    { id: 'seed-cc-marketing', name: 'Marketing' },
  ];

  for (const center of COST_CENTERS) {
    await prisma.costCenter.upsert({
      where: { id: center.id },
      create: {
        id: center.id,
        organizationId,
        name: center.name,
        updatedAt: now(),
      },
      update: { name: center.name, updatedAt: now() },
    });
  }
  console.log(`  centros de custo: ${COST_CENTERS.length}`);

  await prisma.$disconnect();
  await pool.end();
  console.log('Seed concluído.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
