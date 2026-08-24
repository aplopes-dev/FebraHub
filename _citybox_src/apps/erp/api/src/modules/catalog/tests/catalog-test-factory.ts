import { InMemoryBranchRepository } from '../../tenancy/tests/in-memory-branch.repository';
import { InMemorySupplierRepository } from '../../stock/suppliers/tests/in-memory-supplier.repository';
import {
  makeBranch,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../tenancy/tests/tenancy-test-factory';
import {
  type ProductSupplierLink,
  Product,
} from '../domain/entities/product.entity';
import { ProductCategory } from '../domain/entities/product-category.entity';
import { UnitOfMeasure } from '../domain/entities/unit-of-measure.entity';
import { InMemoryProductRepository } from './in-memory-product.repository';
import { InMemoryProductCategoryRepository } from './in-memory-product-category.repository';
import { InMemoryUnitOfMeasureRepository } from './in-memory-unit-of-measure.repository';
import { InMemoryVariationRepository } from './in-memory-variation.repository';
import { InMemoryProductAddonRepository } from './in-memory-product-addon.repository';
import { Variation } from '../domain/entities/variation.entity';
import { ProductAddon } from '../domain/entities/product-addon.entity';

// Reaproveita os ids do tenancy: criar/editar produto valida as unidades pelo
// `BranchRepository`, que é escopado por organização.
export const STORE_ID = ORGANIZATION_ID;
export const OTHER_STORE_ID = OTHER_ORGANIZATION_ID;
export const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
export const UNIT_ID = '22222222-2222-4222-8222-222222222222';
export const VARIATION_ID = '55555555-5555-4555-8555-555555555555';
export const VARIATION_OPTION_ID = '66666666-6666-4666-8666-666666666666';
export const ADDON_ID = '77777777-7777-4777-8777-777777777777';
export const OTHER_ADDON_ID = '88888888-8888-4888-8888-888888888888';
export const PRODUCT_ID = '99999999-9999-4999-8999-999999999991';
export const OTHER_PRODUCT_ID = '99999999-9999-4999-8999-999999999992';
// Cadastros de apoio da segunda loja precisam de ids próprios: os repositórios
// indexam por id (é a PK), então reusar o mesmo id sobrescreveria o da loja 1.
export const OTHER_CATEGORY_ID = '33333333-3333-4333-8333-333333333333';
export const OTHER_UNIT_ID = '44444444-4444-4444-8444-444444444444';

export function makeCategory(
  overrides: Partial<{
    organizationId: string;
    name: string;
    id: string;
    systemKey: string | null;
    isSystem: boolean;
  }> = {},
): ProductCategory {
  return ProductCategory.create(
    {
      organizationId: overrides.organizationId ?? STORE_ID,
      name: overrides.name ?? 'Vestuário',
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
    },
    overrides.id ?? CATEGORY_ID,
  );
}

export function makeUnit(
  overrides: Partial<{
    organizationId: string;
    id: string;
    systemKey: string | null;
    isSystem: boolean;
  }> = {},
): UnitOfMeasure {
  return UnitOfMeasure.create(
    {
      organizationId: overrides.organizationId ?? STORE_ID,
      name: 'Unidade',
      abbreviation: 'un',
      kind: 'unit',
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
    },
    overrides.id ?? UNIT_ID,
  );
}

export function makeVariation(
  overrides: Partial<{
    organizationId: string;
    id: string;
    optionId: string;
  }> = {},
): Variation {
  return Variation.create(
    {
      organizationId: overrides.organizationId ?? STORE_ID,
      name: 'Tamanho',
      calculation: {
        chooseFrom: 1,
        chooseTo: 1,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 1,
        priceMethod: 'sum',
      },
      options: [
        {
          id: overrides.optionId ?? VARIATION_OPTION_ID,
          name: 'P',
          description: '',
          imageUrl: null,
          priceCents: 0,
          code: 'P',
          sortOrder: 0,
        },
      ],
    },
    overrides.id ?? VARIATION_ID,
  );
}

export function makeAddon(
  overrides: Partial<{
    organizationId: string;
    id: string;
    name: string;
    defaultPriceCents: number;
    deletedAt: Date | null;
  }> = {},
): ProductAddon {
  return ProductAddon.create(
    {
      organizationId: overrides.organizationId ?? STORE_ID,
      name: overrides.name ?? 'Bacon',
      defaultPriceCents: overrides.defaultPriceCents ?? 350,
      deletedAt: overrides.deletedAt ?? null,
    },
    overrides.id ?? ADDON_ID,
  );
}

type ProductOverrides = Partial<{
  organizationId: string;
  name: string;
  sku: string;
  type: Product['type'];
  basePriceCents: number;
  hasVariants: boolean;
  branchIds: string[];
  suppliers: ProductSupplierLink[];
  deletedAt: Date | null;
  trackStock: boolean;
  availableOnErp: boolean;
  availableOnPdv: boolean;
  barcodes: string[];
  variationFormat: Product['variationFormat'];
  variations: Product['variations'];
  addonSettings: Product['addonSettings'];
  addonLines: Product['addonLines'];
  suggestions: Product['suggestions'];
}>;

export function makeProduct(
  overrides: ProductOverrides = {},
  id?: string,
): Product {
  return Product.create(
    {
      organizationId: overrides.organizationId ?? STORE_ID,
      name: overrides.name ?? 'Camiseta Básica',
      sku: overrides.sku ?? 'CAM-001',
      categoryId: CATEGORY_ID,
      unitOfMeasureId: UNIT_ID,
      type: overrides.type ?? 'simple',
      basePriceCents: overrides.basePriceCents ?? 5990,
      hasVariants: overrides.hasVariants ?? false,
      branchIds: overrides.branchIds ?? [],
      suppliers: overrides.suppliers ?? [],
      deletedAt: overrides.deletedAt ?? null,
      trackStock: overrides.trackStock ?? false,
      availableOnErp: overrides.availableOnErp,
      availableOnPdv: overrides.availableOnPdv,
      barcodes: overrides.barcodes,
      variationFormat: overrides.variationFormat,
      variations: overrides.variations,
      addonSettings: overrides.addonSettings,
      addonLines: overrides.addonLines ?? [],
      suggestions: overrides.suggestions ?? [],
    },
    id,
  );
}

/** Monta os repositórios in-memory já com categoria e unidade válidas. */
export function makeRepositories() {
  const productRepository = new InMemoryProductRepository();
  const categoryRepository = new InMemoryProductCategoryRepository();
  const unitRepository = new InMemoryUnitOfMeasureRepository();
  const variationRepository = new InMemoryVariationRepository();
  // Vem do tenancy: criar/editar produto valida as unidades informadas.
  const branchRepository = new InMemoryBranchRepository();
  // Criar/editar produto valida também os fornecedores informados.
  const supplierRepository = new InMemorySupplierRepository();
  // Adicionais do produto validam contra o catálogo `ProductAddon`.
  const addonRepository = new InMemoryProductAddonRepository();

  return {
    productRepository,
    categoryRepository,
    unitRepository,
    variationRepository,
    branchRepository,
    supplierRepository,
    addonRepository,
    async seedSupport() {
      await categoryRepository.save(makeCategory());
      await unitRepository.save(makeUnit());
      await branchRepository.save(makeBranch());
    },
  };
}

export function baseCreateInput() {
  return {
    organizationId: STORE_ID,
    name: 'Camiseta Básica',
    sku: 'CAM-001',
    categoryId: CATEGORY_ID,
    unitOfMeasureId: UNIT_ID,
    type: 'simple' as const,
    basePriceCents: 5990,
    perishable: false,
    description: '',
    imageUrl: null,
    trackStock: false,
    barcodes: [],
  };
}
