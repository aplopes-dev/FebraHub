import type { PdvProduct } from '../types/product';

export const PLACEHOLDER_PRODUCTS: readonly PdvProduct[] = [
  {
    id: 'PRD-001',
    name: 'Burger Smash Clássico',
    description:
      'Hambúrguer smash de 150g, queijo cheddar derretido, alface fresca, tomate fatiado e molho especial no pão brioche macio.',
    imageUrl: null,
    category: 'Hambúrguer',
    stock: 48,
    priceCents: 2890,
    status: 'active',
  },
  {
    id: 'PRD-002',
    name: 'Burger Bacon Duplo',
    description:
      'Dois blends smash de 120g cada, muito bacon crocante, fatias duplas de queijo cheddar derretido e maionese defumada.',
    imageUrl: null,
    category: 'Hambúrguer',
    stock: 32,
    priceCents: 3890,
    status: 'active',
  },
  {
    id: 'PRD-003',
    name: 'Hambúrguer Artesanal',
    description:
      'Blend de carne bovina grelhado na brasa, queijo prato, cebola roxa, picles artesanal e molho barbecue.',
    imageUrl: null,
    category: 'Hambúrguer',
    stock: 20,
    priceCents: 3290,
    status: 'active',
  },
  {
    id: 'PRD-004',
    name: 'Batata Frita Média',
    description: 'Porção média de batatas fritas crocantes, temperadas com sal e ervas.',
    imageUrl: null,
    category: 'Acompanhamentos',
    stock: 120,
    priceCents: 1490,
    status: 'active',
  },
  {
    id: 'PRD-005',
    name: 'Milkshake de Chocolate',
    description:
      'Milkshake cremoso de chocolate belga com chantilly e calda de chocolate amargo.',
    imageUrl: null,
    category: 'Bebidas',
    stock: 55,
    priceCents: 1890,
    status: 'active',
  },
  {
    id: 'PRD-006',
    name: 'Refrigerante Lata',
    description: 'Lata 350ml gelada — opções de cola, guaraná ou soda.',
    imageUrl: null,
    category: 'Bebidas',
    stock: 200,
    priceCents: 790,
    status: 'active',
  },
  {
    id: 'PRD-007',
    name: 'Combo Família',
    description:
      'Dois burgers clássicos, duas batatas grandes, onion rings e quatro refrigerantes — ideal para compartilhar em família.',
    imageUrl: null,
    category: 'Combos',
    stock: 15,
    priceCents: 8990,
    status: 'draft',
  },
  {
    id: 'PRD-008',
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e fritos até dourar, acompanhados de molho especial.',
    imageUrl: null,
    category: 'Acompanhamentos',
    stock: 40,
    priceCents: 1690,
    status: 'inactive',
  },
] as const;

export const PRODUCT_CATEGORIES: readonly string[] = [
  'Hambúrguer',
  'Acompanhamentos',
  'Bebidas',
  'Combos',
] as const;
