import type { CatalogProduct } from '../types/catalog-product';

/**
 * Produtos mock do catálogo até integrar API.
 * `menuId` referencia `PLACEHOLDER_CATALOG_MENUS` (exceto `all`).
 */
export const PLACEHOLDER_CATALOG_PRODUCTS: readonly CatalogProduct[] = [
  {
    id: 'p-1',
    menuId: 'menu-hamburguer',
    name: 'Burger Smash Clássico',
    priceCents: 2890,
    imageUrl: null,
    description: 'Hambúrguer smash de 150g, queijo cheddar derretido, alface fresca, tomate fatiado e molho especial no pão brioche macio.',
    options: [
      {
        id: 'size',
        name: 'Tamanho',
        required: true,
        minChoices: 1,
        maxChoices: 1,
        values: [
          { id: 'size-regular', name: 'Regular', priceCents: 0 },
          { id: 'size-large', name: 'Grande', priceCents: 800 },
        ],
      },
      {
        id: 'addons',
        name: 'Adicionais (Add-ons)',
        required: false,
        minChoices: 0,
        maxChoices: 5,
        values: [
          { id: 'add-onions', name: 'Cebola caramelizada', priceCents: 300 },
          { id: 'add-cheese', name: 'Queijo cheddar extra', priceCents: 450 },
          { id: 'add-egg', name: 'Ovo frito extra', priceCents: 300 },
        ],
      },
    ],
  },
  {
    id: 'p-2',
    menuId: 'menu-hamburguer',
    name: 'Burger Bacon Duplo',
    priceCents: 3890,
    imageUrl: null,
    description: 'Dois blends smash de 120g cada, muito bacon crocante, fatias duplas de queijo cheddar derretido e maionese defumada.',
    options: [
      {
        id: 'size',
        name: 'Tamanho',
        required: true,
        minChoices: 1,
        maxChoices: 1,
        values: [
          { id: 'size-regular', name: 'Regular', priceCents: 0 },
          { id: 'size-large', name: 'Grande', priceCents: 1000 },
        ],
      },
      {
        id: 'addons',
        name: 'Adicionais (Add-ons)',
        required: false,
        minChoices: 0,
        maxChoices: 5,
        values: [
          { id: 'add-bacon', name: 'Bacon extra', priceCents: 500 },
          { id: 'add-cheese', name: 'Queijo cheddar extra', priceCents: 450 },
        ],
      },
    ],
  },
  {
    id: 'p-3',
    menuId: 'menu-hamburguer',
    name: 'Hambúrguer Artesanal',
    priceCents: 3290,
    imageUrl: null,
    description: 'Blend de carne bovina grelhado na brasa, queijo prato, cebola roxa, picles artesanal e molho barbecue.',
  },
  {
    id: 'p-4',
    menuId: 'menu-hamburguer',
    name: 'Hambúrguer Cheddar',
    priceCents: 3090,
    imageUrl: null,
    description: 'Blend suculento de 150g coberto com muito queijo cheddar cremoso e cebola caramelizada no pão australiano.',
  },
  {
    id: 'p-5',
    menuId: 'menu-frango-frito',
    name: 'Frango Frito Crocante',
    priceCents: 2790,
    imageUrl: null,
    description: 'Tiras de peito de frango super crocantes, marinadas em especiarias e empanadas. Acompanha molho mostarda e mel.',
  },
  {
    id: 'p-6',
    menuId: 'menu-frango-frito',
    name: 'Balde de Frango',
    priceCents: 4590,
    imageUrl: null,
    description: 'Um balde generoso com pedaços selecionados de frango frito (coxas e sobrecoxas) bem crocantes e suculentos.',
  },
  {
    id: 'p-7',
    menuId: 'menu-bebidas',
    name: 'Refrigerante Lata',
    priceCents: 690,
    imageUrl: null,
    description: 'Lata de 350ml trincando de gelada. Escolha a sua opção de sabor no caixa.',
  },
  {
    id: 'p-8',
    menuId: 'menu-bebidas',
    name: 'Suco Natural 500ml',
    priceCents: 1290,
    imageUrl: null,
    description: 'Suco feito na hora com frutas frescas selecionadas de alta qualidade. Sem adição de conservantes.',
    options: [
      {
        id: 'juice-flavor',
        name: 'Sabor do Suco',
        required: true,
        minChoices: 1,
        maxChoices: 1,
        values: [
          { id: 'juice-orange', name: 'Laranja', priceCents: 0 },
          { id: 'juice-lemon', name: 'Limão', priceCents: 0 },
          { id: 'juice-strawberry', name: 'Morango', priceCents: 200 },
        ],
      },
    ],
  },
  {
    id: 'p-9',
    menuId: 'menu-cafe',
    name: 'Café Espresso',
    priceCents: 590,
    imageUrl: null,
    description: 'Café espresso curto feito com grãos de café arábica moídos na hora. Aroma marcante e crema perfeita.',
  },
  {
    id: 'p-10',
    menuId: 'menu-cafe',
    name: 'Cappuccino Cremoso',
    priceCents: 1190,
    imageUrl: null,
    description: 'Cappuccino italiano clássico: espresso, leite vaporizado cremoso, polvilhado com cacau em pó 100%.',
  },
  {
    id: 'p-11',
    menuId: 'menu-sorvete',
    name: 'Sorvete de Baunilha',
    priceCents: 990,
    imageUrl: null,
    description: 'Casquinha ou copo com sorvete de baunilha premium cremoso de textura suave.',
  },
  {
    id: 'p-12',
    menuId: 'menu-sorvete',
    name: 'Sundae de Chocolate',
    priceCents: 1490,
    imageUrl: null,
    description: 'Sundae com duas bolas de sorvete premium de baunilha, calda quente de chocolate e castanhas picadas.',
  },
  {
    id: 'p-13',
    menuId: 'menu-outros',
    name: 'Batata Frita',
    priceCents: 1590,
    imageUrl: null,
    description: 'Batatas fritas sequinhas, crocantes e temperadas com sal e alecrim fresco.',
    options: [
      {
        id: 'fries-sauce',
        name: 'Molho extra',
        required: false,
        minChoices: 0,
        maxChoices: 3,
        values: [
          { id: 'fries-mayo', name: 'Maionese da casa', priceCents: 250 },
          { id: 'fries-cheddar', name: 'Cheddar cremoso', priceCents: 400 },
        ],
      },
    ],
  },
  {
    id: 'p-14',
    menuId: 'menu-outros',
    name: 'Onion Rings',
    priceCents: 1690,
    imageUrl: null,
    description: 'Anéis de cebola gigantes empanados e fritos até dourar. Crocância incrível por fora e maciez por dentro.',
  },
  {
    id: 'p-15',
    menuId: 'menu-hamburguer',
    name: 'Burger Vegetariano',
    priceCents: 2990,
    imageUrl: null,
    description: 'Hambúrguer artesanal de grão-de-bico com quinoa, queijo prato derretido, rúcula e molho de ervas finas.',
  },
] as const;

export function formatCatalogPrice(priceCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceCents / 100);
}

