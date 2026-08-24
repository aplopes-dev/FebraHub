/**
 * Seed idempotente do domínio consumer (Postgres) + índice de produtos (Typesense).
 * Dados copiados literalmente do frontend web:
 *   - web/src/api/seed/catalog.ts (produtos, categorias, home sections)
 *   - web/src/data/mock.ts + locales pt-BR (reviews, cupons, frete, FAQ, páginas)
 *   - web/src/mocks/handlers/content.ts (banners)
 *
 * Executar: pnpm seed  (ou: tsx scripts/seed.ts)
 */
import { getConsumerClient } from '../src/database/consumer.js';
import {
  createTypesenseClient,
  PRODUCTS_COLLECTION,
  PRODUCTS_SCHEMA,
} from '../src/search/client.js';

// ── Categorias ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'ofertas', name: 'Ofertas', icon: '🏷️', colorHex: '#fafafa' },
  { id: 'supermercado', name: 'Mercado', icon: '🛒', colorHex: '#fafafa' },
  { id: 'moda', name: 'Moda', icon: '👕', colorHex: '#fafafa' },
  { id: 'tecnologia', name: 'Tecnologia', icon: '📱', colorHex: '#fafafa' },
  { id: 'casa', name: 'Casa', icon: '🛋️', colorHex: '#fafafa' },
  { id: 'beleza', name: 'Beleza', icon: '💄', colorHex: '#fafafa' },
  { id: 'esportes', name: 'Esportes', icon: '⚽', colorHex: '#fafafa' },
  { id: 'cupons', name: 'Cupons', icon: '🎟️', colorHex: '#fafafa' },
].map((c, i) => ({ ...c, sortOrder: i }));

// ── Produtos (web/src/api/seed/catalog.ts + nomes pt-BR) ───────────────────

interface SeedProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  rating: number;
  reviewCount: number;
  isFreeShipping: boolean;
  isExpress: boolean;
  categoryId: string;
  brand: string | null;
}

const PRODUCTS: SeedProduct[] = [
  {
    id: 'p1',
    name: 'Smartphone Galaxy A55 5G 256GB 8GB RAM Câmera Tripla 50MP',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Galaxy_A55.jpg/500px-Galaxy_A55.jpg',
    price: 1799.9,
    originalPrice: 2199,
    discountPercent: 18,
    rating: 4.7,
    reviewCount: 845,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'tecnologia',
    brand: 'Samsung',
  },
  {
    id: 'p2',
    name: 'Fone de Ouvido Bluetooth In-ear com Cancelamento de Ruído',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sony_S_Wireless_Headphones_%2847103208%29.jpeg/500px-Sony_S_Wireless_Headphones_%2847103208%29.jpeg',
    price: 199.9,
    originalPrice: 349,
    discountPercent: 43,
    rating: 4.5,
    reviewCount: 2310,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'tecnologia',
    brand: 'Sony',
  },
  {
    id: 'p3',
    name: 'Smart TV 50" 4K UHD LED com HDR e Wi-Fi Integrado',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Samsung_QLED_TV_8K_-_75_inches_-_2018-11-02.jpg/500px-Samsung_QLED_TV_8K_-_75_inches_-_2018-11-02.jpg',
    price: 2099,
    originalPrice: 2799,
    discountPercent: 25,
    rating: 4.8,
    reviewCount: 530,
    isFreeShipping: true,
    isExpress: false,
    categoryId: 'casa',
    brand: 'Samsung',
  },
  {
    id: 'p4',
    name: 'Cadeira Gamer Ergonômica Reclinável com Apoio Lombar',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Gaming_chair.jpg/500px-Gaming_chair.jpg',
    price: 899.9,
    originalPrice: 1299,
    discountPercent: 30,
    rating: 4.4,
    reviewCount: 1180,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'casa',
    brand: 'Unknown',
  },
  {
    id: 'p5',
    name: 'Notebook Ultra 15.6" Core i5 16GB SSD 512GB Windows 11',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/MacBook_Pro.jpg/500px-MacBook_Pro.jpg',
    price: 3299,
    originalPrice: 3999,
    discountPercent: 17,
    rating: 4.6,
    reviewCount: 312,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'tecnologia',
    brand: 'Apple',
  },
  {
    id: 'p6',
    name: 'Tênis Esportivo Corrida Masculino Leve Amortecimento',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Running_shoes.jpg/500px-Running_shoes.jpg',
    price: 249.9,
    originalPrice: 399,
    discountPercent: 37,
    rating: 4.3,
    reviewCount: 4205,
    isFreeShipping: true,
    isExpress: false,
    categoryId: 'esportes',
    brand: 'Unknown',
  },
  {
    id: 'p7',
    name: 'Air Fryer Fritadeira sem Óleo 5L Digital Antiaderente',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Air_Fryer_2020.jpg/500px-Air_Fryer_2020.jpg',
    price: 379.9,
    originalPrice: 549,
    discountPercent: 31,
    rating: 4.7,
    reviewCount: 6840,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'casa',
    brand: 'Unknown',
  },
  {
    id: 'p8',
    name: "Relógio Smartwatch Tela AMOLED GPS à Prova d'água",
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Apple_Watch_Ultra_2.jpg/500px-Apple_Watch_Ultra_2.jpg',
    price: 459.9,
    originalPrice: 699,
    discountPercent: 34,
    rating: 4.5,
    reviewCount: 1925,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'tecnologia',
    brand: 'Apple',
  },
  {
    id: 'p9',
    name: 'Café Torrado e Moído Tradicional 500g',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Coffee_beans.jpg/500px-Coffee_beans.jpg',
    price: 18.9,
    originalPrice: 24.9,
    discountPercent: 24,
    rating: 4.6,
    reviewCount: 3120,
    isFreeShipping: false,
    isExpress: false,
    categoryId: 'supermercado',
    brand: 'Pilão',
  },
  {
    id: 'p10',
    name: 'Azeite de Oliva Extra Virgem 500ml',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Olive_oil.jpg',
    price: 32.9,
    originalPrice: 45,
    discountPercent: 27,
    rating: 4.7,
    reviewCount: 1480,
    isFreeShipping: false,
    isExpress: true,
    categoryId: 'supermercado',
    brand: 'Gallo',
  },
  {
    id: 'p11',
    name: 'Camiseta Básica Algodão Premium Unissex',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/T-shirt.jpg/500px-T-shirt.jpg',
    price: 59.9,
    originalPrice: 89.9,
    discountPercent: 33,
    rating: 4.4,
    reviewCount: 2050,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'moda',
    brand: 'Hering',
  },
  {
    id: 'p12',
    name: 'Tênis Casual em Couro Legítimo Masculino',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Leather_shoes.jpg/500px-Leather_shoes.jpg',
    price: 289.9,
    originalPrice: 459,
    discountPercent: 37,
    rating: 4.5,
    reviewCount: 870,
    isFreeShipping: true,
    isExpress: false,
    categoryId: 'moda',
    brand: 'Democrata',
  },
  {
    id: 'p13',
    name: 'Perfume Eau de Parfum Feminino 100ml',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Perfume_bottle.jpg/500px-Perfume_bottle.jpg',
    price: 199.9,
    originalPrice: 299,
    discountPercent: 33,
    rating: 4.8,
    reviewCount: 1640,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'beleza',
    brand: 'Natura',
  },
  {
    id: 'p14',
    name: 'Kit Skincare Sérum Vitamina C + Hidratante',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Woman_applying_serum_on_her_face_closeup.jpg/500px-Woman_applying_serum_on_her_face_closeup.jpg',
    price: 149.9,
    originalPrice: 219,
    discountPercent: 32,
    rating: 4.6,
    reviewCount: 980,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'beleza',
    brand: 'La Roche-Posay',
  },
  {
    id: 'p15',
    name: "Caixa de Som Bluetooth Portátil à Prova d'água 20W",
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/JBL_Flip_3_bluetooth_speaker_%28DSCF2653%29.jpg/500px-JBL_Flip_3_bluetooth_speaker_%28DSCF2653%29.jpg',
    price: 129.9,
    originalPrice: 299,
    discountPercent: 57,
    rating: 4.4,
    reviewCount: 5230,
    isFreeShipping: true,
    isExpress: true,
    categoryId: 'ofertas',
    brand: 'JBL',
  },
  {
    id: 'p16',
    name: 'Liquidificador 1200W 12 Velocidades com Filtro',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Blender.jpg',
    price: 159.9,
    originalPrice: 329,
    discountPercent: 51,
    rating: 4.5,
    reviewCount: 2740,
    isFreeShipping: false,
    isExpress: false,
    categoryId: 'ofertas',
    brand: 'Philips Walita',
  },
];

// ── Home sections ──────────────────────────────────────────────────────────

const HOME_SECTIONS = [
  { id: 'daily-deals', title: 'Ofertas do dia', productIds: ['p1', 'p2', 'p3', 'p4'], sortOrder: 0 },
  { id: 'best-sellers', title: 'Mais vendidos', productIds: ['p8', 'p7', 'p6', 'p5'], sortOrder: 1 },
];

// ── Reviews (web/src/data/mock.ts + locale engagement pt-BR) ───────────────

const REVIEWS = [
  { id: 'r1', productId: 'p1', author: 'Ana Paula', text: 'Produto excelente, entrega rápida!', rating: 5, date: new Date('2024-03-15T12:00:00.000Z') },
  { id: 'r2', productId: 'p1', author: 'Carlos M.', text: 'Melhor smartphone que já tive.', rating: 5, date: new Date('2024-03-10T12:00:00.000Z') },
  { id: 'r3', productId: 'p1', author: 'Juliana R.', text: 'Ótimo, mas poderia ser mais barato.', rating: 4, date: new Date('2024-03-05T12:00:00.000Z') },
  { id: 'r4', productId: 'p2', author: 'Pedro S.', text: 'Cancelamento de ruído impecável.', rating: 5, date: new Date('2024-02-20T12:00:00.000Z') },
  { id: 'r5', productId: 'p2', author: 'Marina L.', text: 'Som muito bom, case poderia ser menor.', rating: 4, date: new Date('2024-02-18T12:00:00.000Z') },
];

// ── Cupons (web/src/data/mock.ts) ──────────────────────────────────────────

const COUPONS = [
  { code: 'PRIMEIRA10', description: '10% na primeira compra', type: 'PERCENT', value: 10, expiry: new Date('2024-12-31T23:59:59.000Z'), minSubtotal: null as number | null },
  { code: 'FRETEGRATIS', description: 'Frete grátis acima de R$ 99', type: 'FIXED', value: 15, expiry: new Date('2024-06-30T23:59:59.000Z'), minSubtotal: 99 },
  { code: 'TECH50', description: 'R$ 50 off em tecnologia', type: 'FIXED', value: 50, expiry: new Date('2024-08-15T23:59:59.000Z'), minSubtotal: null },
];

// ── Frete (web/src/data/mock.ts + locale checkout pt-BR) ───────────────────

const SHIPPING_OPTIONS = [
  { id: 'express', name: 'Express', deliveryEstimate: 'Amanhã até 22h', price: 0, isExpress: true, sortOrder: 0 },
  { id: 'normal', name: 'Normal', deliveryEstimate: '3 a 5 dias úteis', price: 12.9, isExpress: false, sortOrder: 1 },
  { id: 'economico', name: 'Econômico', deliveryEstimate: '7 a 10 dias úteis', price: 7.9, isExpress: false, sortOrder: 2 },
];

// ── FAQ (locale faq pt-BR) ─────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    id: 'faq-track-order',
    question: 'Como rastrear meu pedido?',
    answer:
      'Acesse Minhas Compras, toque no pedido e use o botão Rastrear para ver a timeline e o código de rastreio.',
  },
  {
    id: 'faq-cancel-order',
    question: 'Como cancelar uma compra?',
    answer:
      'Pedidos ainda não enviados podem ser cancelados em Detalhe do pedido → Cancelar. Após o envio, solicite devolução.',
  },
  {
    id: 'faq-payment-methods',
    question: 'Quais formas de pagamento aceitas?',
    answer:
      'Aceitamos PIX (5% off), cartão de crédito e boleto bancário. Cartões salvos ficam em Meus Cartões.',
  },
  {
    id: 'faq-free-shipping',
    question: 'Como funciona o frete grátis?',
    answer:
      'Clientes CityBox+ têm frete grátis em compras elegíveis. Confira o banner na Home e opções no checkout.',
  },
  {
    id: 'faq-use-coupon',
    question: 'Como usar um cupom?',
    answer:
      'Digite o código no Carrinho ou Checkout, ou escolha um cupom disponível em Conta → Cupons.',
  },
  {
    id: 'faq-change-address',
    question: 'Como alterar meu endereço?',
    answer:
      'Em Conta → Endereços você pode adicionar, editar ou definir o endereço padrão. No checkout, use Alterar.',
  },
  {
    id: 'faq-citybox-plus',
    question: 'O que é o CityBox+?',
    answer:
      'Assinatura com entregas grátis e benefícios exclusivos. Gerencie em Conta → banner CityBox+.',
  },
].map((f, i) => ({ ...f, sortOrder: i }));

// ── Banners (web/src/mocks/handlers/content.ts) ────────────────────────────

const BANNERS = [
  {
    id: 'banner-deals',
    title: 'Ofertas do dia',
    subtitle: 'Até 40% off em tecnologia',
    imageUrl: '/assets/banners/home-hero.png',
    actionType: 'ROUTE',
    actionQuery: '/categoria/ofertas',
    sortOrder: 0,
    active: true,
  },
  {
    id: 'banner-plus',
    title: 'CityBox+',
    subtitle: 'Frete grátis em todas as compras',
    imageUrl: '/banners/plus.svg',
    actionType: 'ROUTE',
    actionQuery: '/assinatura',
    sortOrder: 1,
    active: true,
  },
];

// ── Páginas estáticas (locale legal pt-BR) ─────────────────────────────────

const STATIC_PAGES = [
  {
    slug: 'about',
    title: 'Sobre o CityBox',
    content:
      'O CityBox é o marketplace que conecta você aos melhores produtos com entrega expressa. Fundado em 2020, já entregamos milhões de pedidos com satisfação garantida.',
  },
  {
    slug: 'terms',
    title: 'Termos de Uso',
    content:
      'Termos de Uso do CityBox. Ao utilizar nossos serviços, você concorda com as condições de compra, política de devolução em até 7 dias e proteção ao consumidor conforme o CDC.',
  },
  {
    slug: 'privacy',
    title: 'Política de Privacidade',
    content:
      'Política de Privacidade. Seus dados são protegidos conforme a LGPD. Coletamos apenas informações necessárias para processar pedidos e melhorar sua experiência.',
  },
];

// ── Execução ───────────────────────────────────────────────────────────────

async function seedPostgres() {
  const db = getConsumerClient();

  for (const category of CATEGORIES) {
    await db.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  for (const product of PRODUCTS) {
    await db.product.upsert({
      where: { id: product.id },
      update: { ...product, published: true },
      create: { ...product, published: true },
    });
  }

  for (const section of HOME_SECTIONS) {
    await db.homeSection.upsert({
      where: { id: section.id },
      update: section,
      create: section,
    });
  }

  for (const review of REVIEWS) {
    await db.review.upsert({
      where: { id: review.id },
      update: review,
      create: review,
    });
  }

  for (const coupon of COUPONS) {
    await db.coupon.upsert({
      where: { code: coupon.code },
      update: { ...coupon, active: true },
      create: { ...coupon, active: true },
    });
  }

  for (const option of SHIPPING_OPTIONS) {
    await db.shippingOption.upsert({
      where: { id: option.id },
      update: { ...option, active: true },
      create: { ...option, active: true },
    });
  }

  for (const item of FAQ_ITEMS) {
    await db.faqItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  for (const banner of BANNERS) {
    await db.banner.upsert({
      where: { id: banner.id },
      update: banner,
      create: banner,
    });
  }

  for (const page of STATIC_PAGES) {
    await db.staticPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content },
      create: page,
    });
  }

  return db;
}

async function indexTypesense() {
  const categoryNameById = new Map(CATEGORIES.map((c) => [c.id, c.name]));
  const docs = PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand ?? undefined,
    category: categoryNameById.get(p.categoryId) ?? p.categoryId,
    categoryId: p.categoryId,
    price: p.price,
    rating: p.rating,
    published: true,
  }));

  try {
    const typesense = createTypesenseClient();
    try {
      await typesense.collections(PRODUCTS_COLLECTION).delete();
    } catch {
      // coleção pode não existir ainda — ok
    }
    await typesense.collections().create(PRODUCTS_SCHEMA);
    await typesense.collections(PRODUCTS_COLLECTION).documents().import(docs, {
      action: 'upsert',
    });
    console.log(`[seed] Typesense: ${docs.length} produtos indexados em "${PRODUCTS_COLLECTION}"`);
  } catch (error) {
    console.warn(
      '[seed] Aviso: Typesense indisponível — índice de busca não atualizado.',
      error instanceof Error ? error.message : error,
    );
  }
}

async function main() {
  const db = await seedPostgres();
  await indexTypesense();

  const [categories, products, sections, reviews, coupons, shipping, faq, banners, pages] =
    await Promise.all([
      db.category.count(),
      db.product.count(),
      db.homeSection.count(),
      db.review.count(),
      db.coupon.count(),
      db.shippingOption.count(),
      db.faqItem.count(),
      db.banner.count(),
      db.staticPage.count(),
    ]);

  console.log('[seed] Concluído:');
  console.log(`  categorias:       ${categories}`);
  console.log(`  produtos:         ${products}`);
  console.log(`  home sections:    ${sections}`);
  console.log(`  reviews:          ${reviews}`);
  console.log(`  cupons:           ${coupons}`);
  console.log(`  opções de frete:  ${shipping}`);
  console.log(`  FAQ:              ${faq}`);
  console.log(`  banners:          ${banners}`);
  console.log(`  páginas:          ${pages}`);

  await db.$disconnect();
}

main().catch((error) => {
  console.error('[seed] Falhou:', error);
  process.exitCode = 1;
});
