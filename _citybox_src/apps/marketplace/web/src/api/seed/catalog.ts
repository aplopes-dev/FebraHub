/** Catálogo seed (formato BFF) — textos resolvidos via i18n pt-BR. */
import i18n from '@/i18n';
import type { ApiCategory, ApiHomeData, ApiProduct } from '../types';

type ProductSpec = Omit<ApiProduct, 'name' | 'category'>;

const PRODUCT_SPECS: ProductSpec[] = [
  {
    id: 'p1',
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

const CATEGORY_SPECS = [
  { id: 'ofertas', icon: '🏷️', colorHex: '#fafafa' },
  { id: 'supermercado', icon: '🛒', colorHex: '#fafafa' },
  { id: 'moda', icon: '👕', colorHex: '#fafafa' },
  { id: 'tecnologia', icon: '📱', colorHex: '#fafafa' },
  { id: 'casa', icon: '🛋️', colorHex: '#fafafa' },
  { id: 'beleza', icon: '💄', colorHex: '#fafafa' },
  { id: 'esportes', icon: '⚽', colorHex: '#fafafa' },
  { id: 'cupons', icon: '🎟️', colorHex: '#fafafa' },
] as const;

function localizeProduct(spec: ProductSpec): ApiProduct {
  return {
    ...spec,
    name: i18n.t(`products.${spec.id}.name`, { ns: 'catalog' }),
    category: i18n.t(`categories.${spec.categoryId}`, { ns: 'catalog' }),
  };
}

export function getSeedProducts(): ApiProduct[] {
  return PRODUCT_SPECS.map(localizeProduct);
}

export function getSeedCategories(): ApiCategory[] {
  return CATEGORY_SPECS.map((c) => ({
    ...c,
    name: i18n.t(`categories.${c.id}`, { ns: 'catalog' }),
  }));
}

export function getSeedHome(): ApiHomeData {
  return {
    sections: [
      {
        id: 'daily-deals',
        title: i18n.t('sections.dailyOffers', { ns: 'catalog' }),
        productIds: ['p1', 'p2', 'p3', 'p4'],
      },
      {
        id: 'best-sellers',
        title: i18n.t('sections.bestSellers', { ns: 'catalog' }),
        productIds: ['p8', 'p7', 'p6', 'p5'],
      },
    ],
    products: getSeedProducts(),
  };
}

export const SEED_PRODUCTS = getSeedProducts();
export const SEED_CATEGORIES = getSeedCategories();
export const SEED_HOME = getSeedHome();

export const SEED_AUTH_USER = {
  id: 'usr_camila',
  name: 'Camila Souza',
  email: 'camila@email.com',
  phone: '(11) 98765-4321',
  avatarUrl: null as string | null,
  avatarInitial: 'C',
  isPlus: true,
  hasSeenOnboarding: true,
};
