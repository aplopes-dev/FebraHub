import 'package:citybox_pdv/features/counter/domain/counter_category.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

/// Fixture histórica do Balcão — **somente para testes** (override de
/// `catalogSourceProvider` / `FixtureCatalogSource`).
///
/// Em produção o catálogo vem de `GET /v1/pos/catalog` + cache
/// `pdv.catalog.v1`. Não usar estas constantes como fallback de runtime.
const List<CounterCategory> counterCategories = <CounterCategory>[
  CounterCategory(id: 'almoco', label: 'Almoço'),
  CounterCategory(id: 'bebidas', label: 'Bebidas'),
  CounterCategory(id: 'cervejas', label: 'Cervejas'),
  CounterCategory(id: 'pizzas', label: 'Pizzas'),
  CounterCategory(id: 'quentinhas', label: 'Quentinhas'),
  CounterCategory(id: 'varejo', label: 'Varejo'),
  CounterCategory(id: 'hortifruti', label: 'Hortifruti'),
];

const List<CounterProduct> counterProducts = <CounterProduct>[
  CounterProduct(
    id: 'agua_com_gas',
    name: 'Água Mineral c/ Gás',
    priceCents: 300,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'agua_sem_gas',
    name: 'Água Mineral s/ Gás',
    priceCents: 250,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'amstel_lata',
    name: 'Amstel Lata',
    priceCents: 500,
    categoryId: 'cervejas',
  ),
  CounterProduct(
    id: 'brahma_duplo_malte',
    name: 'Brahma Duplo Malte',
    priceCents: 550,
    categoryId: 'cervejas',
  ),
  CounterProduct(
    id: 'coca_1_5l',
    name: 'Coca Cola 1,5 Litro',
    priceCents: 1200,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'coca_1l',
    name: 'Coca Cola 1 Litro',
    priceCents: 1000,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'guarana_1l',
    name: 'Guaraná 1 Litro',
    priceCents: 800,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'h2o',
    name: 'H2O',
    priceCents: 500,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'heineken_long',
    name: 'Heineken Long',
    priceCents: 1000,
    categoryId: 'cervejas',
  ),
  CounterProduct(
    id: 'pizza_familia',
    name: 'Pizza Família',
    priceCents: 5000,
    categoryId: 'pizzas',
    allowsHalf: true,
    allowsAddons: true,
    addonIds: <String>['borda_catupiry', 'borda_cheddar'],
  ),
  CounterProduct(
    id: 'pizza_grande',
    name: 'Pizza Grande',
    priceCents: 4500,
    categoryId: 'pizzas',
    allowsHalf: true,
    allowsAddons: true,
    addonIds: <String>['borda_catupiry', 'borda_cheddar'],
  ),
  CounterProduct(
    id: 'pizza_media',
    name: 'Pizza Média',
    priceCents: 4000,
    categoryId: 'pizzas',
    allowsHalf: true,
    allowsAddons: true,
    addonIds: <String>['borda_catupiry'],
  ),
  CounterProduct(
    id: 'quentinha_g',
    name: 'Quentinha G',
    priceCents: 2200,
    categoryId: 'quentinhas',
  ),
  CounterProduct(
    id: 'quentinha_m',
    name: 'Quentinha M',
    priceCents: 1800,
    categoryId: 'quentinhas',
  ),
  CounterProduct(
    id: 'refeicao_kg',
    name: 'Refeição KG',
    priceCents: 4000,
    categoryId: 'almoco',
  ),
  CounterProduct(
    id: 'refri_lata',
    name: 'Refri Lata',
    priceCents: 500,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'self_service',
    name: 'Self Service',
    priceCents: 2500,
    categoryId: 'almoco',
  ),
  CounterProduct(
    id: 'skol_latao',
    name: 'Skol Latão',
    priceCents: 500,
    categoryId: 'cervejas',
  ),
  CounterProduct(
    id: 'spaten_600ml',
    name: 'Spaten 600ml',
    priceCents: 1300,
    categoryId: 'cervejas',
  ),
  CounterProduct(
    id: 'suco_laranja_meia_jarra',
    name: 'Suco de Laranja 1/2 Jarra',
    priceCents: 800,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'suco_laranja_copo',
    name: 'Suco de Laranja Copo',
    priceCents: 500,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'suco_laranja_jarra',
    name: 'Suco de Laranja Jarra',
    priceCents: 1500,
    categoryId: 'bebidas',
  ),
  CounterProduct(
    id: 'suco_polpa',
    name: 'Suco de Polpa',
    priceCents: 500,
    categoryId: 'bebidas',
  ),
  // --- Varejo fixture ------------------------------------------------------
  CounterProduct(
    id: 'coca_lata_barcode',
    name: 'Coca-Cola Lata 350ml',
    priceCents: 450,
    categoryId: 'varejo',
    barcodes: <String>['7894900011517'],
  ),
  CounterProduct(
    id: 'camisa_basica',
    name: 'Camisa básica',
    priceCents: 7990,
    categoryId: 'varejo',
    barcodes: <String>['7891000100101'],
    variants: <ProductVariant>[
      ProductVariant(
        id: 'camisa_m_azul',
        productId: 'camisa_basica',
        attributes: <String, String>{'size': 'M', 'color': 'Azul'},
        priceCents: 7990,
        barcode: '7891000100102',
      ),
      ProductVariant(
        id: 'camisa_g_azul',
        productId: 'camisa_basica',
        attributes: <String, String>{'size': 'G', 'color': 'Azul'},
        priceCents: 7990,
        barcode: '7891000100103',
      ),
      ProductVariant(
        id: 'camisa_m_preta',
        productId: 'camisa_basica',
        attributes: <String, String>{'size': 'M', 'color': 'Preta'},
        priceCents: 8490,
        barcode: '7891000100104',
        available: false,
      ),
    ],
  ),
  CounterProduct(
    id: 'banana_kg',
    name: 'Banana prata (kg)',
    priceCents: 0,
    categoryId: 'hortifruti',
    barcodes: <String>['2001001000001'],
    soldByWeight: true,
    pricePerKgCents: 699,
  ),
];

/// Adicionais de fixture (food).
const List<CatalogAddon> catalogAddons = <CatalogAddon>[
  CatalogAddon(
    id: 'borda_catupiry',
    name: 'Borda Catupiry',
    unitPriceCents: 800,
  ),
  CatalogAddon(id: 'borda_cheddar', name: 'Borda Cheddar', unitPriceCents: 800),
];
