export type KpiCardData = {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconName: 'order' | 'revenue' | 'customer' | 'new_customer';
};

export const MOCK_KPI_CARDS: KpiCardData[] = [
  {
    id: 'total_orders',
    title: 'Total de Pedidos',
    value: '72.099',
    change: '+7%',
    isPositive: true,
    iconName: 'order',
  },
  {
    id: 'total_revenue',
    title: 'Receita Total',
    value: 'R$ 349.005',
    change: '+12%',
    isPositive: true,
    iconName: 'revenue',
  },
  {
    id: 'total_customers',
    title: 'Total de Clientes',
    value: '50.921',
    change: '+4%',
    isPositive: true,
    iconName: 'customer',
  },
  {
    id: 'new_customers',
    title: 'Novos Clientes',
    value: '6.007',
    change: '-5%',
    isPositive: false,
    iconName: 'new_customer',
  },
];

export type TopProductItem = {
  rank: number;
  name: string;
  salesCount: number;
  imageUrl?: string;
};

export const MOCK_TOP_PRODUCTS: TopProductItem[] = [
  {
    rank: 1,
    name: 'Special Crispyburger',
    salesCount: 9778,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 2,
    name: 'Double Cheeseburger',
    salesCount: 7640,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 3,
    name: 'Chocolate Milkshake',
    salesCount: 7620,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 4,
    name: 'Combo Coxa & Batata Frita',
    salesCount: 7184,
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 5,
    name: 'Coca-Cola 350ml',
    salesCount: 4659,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 6,
    name: 'Cheeseburger Deluxe',
    salesCount: 3880,
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 7,
    name: 'Sundae de Baunilha',
    salesCount: 3783,
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 8,
    name: 'Frango Frito Picante',
    salesCount: 3366,
    imageUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 9,
    name: 'Asinhas de Frango 3 Queijos',
    salesCount: 1278,
    imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=100&auto=format&fit=crop&q=80',
  },
  {
    rank: 10,
    name: 'Sprite 350ml',
    salesCount: 808,
    imageUrl: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=100&auto=format&fit=crop&q=80',
  },
];

export type SalesOverviewPoint = {
  month: string;
  sales: number;
  label: string;
};

export const MOCK_SALES_OVERVIEW: SalesOverviewPoint[] = [
  { month: 'Mai', sales: 2400, label: 'Maio 2024' },
  { month: 'Jun', sales: 1800, label: 'Junho 2024' },
  { month: 'Jul', sales: 3200, label: 'Julho 2024' },
  { month: 'Ago', sales: 4802, label: 'Agosto 2024' },
  { month: 'Set', sales: 3800, label: 'Setembro 2024' },
  { month: 'Out', sales: 6200, label: 'Outubro 2024' },
];

export type ProductStatusData = {
  active: number;
  inactive: number;
  draft: number;
  total: number;
};

export const MOCK_PRODUCT_STATUS: ProductStatusData = {
  active: 52,
  inactive: 7,
  draft: 2,
  total: 61,
};

export type StockStatusData = {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  total: number;
};

export const MOCK_STOCK_STATUS: StockStatusData = {
  inStock: 32,
  lowStock: 1,
  outOfStock: 3,
  total: 36,
};

export type RecentOrderReportItem = {
  id: string;
  status: 'in_progress' | 'open' | 'completed';
  orderDate: string;
  customerName?: string;
  orderType: 'No Local' | 'Para Viagem';
  qty?: number;
  totalCents?: number;
};

export const MOCK_RECENT_ORDERS: RecentOrderReportItem[] = [
  {
    id: '#201OE10',
    status: 'in_progress',
    orderDate: '16 Out, 2024\n09:31 AM',
    customerName: 'Dian Rahmani',
    orderType: 'No Local',
    qty: 5,
    totalCents: 3450,
  },
  {
    id: '#926MN67',
    status: 'open',
    orderDate: '16 Out, 2024\n11:32 AM',
    customerName: 'Sinta Dewi',
    orderType: 'No Local',
  },
  {
    id: '#201OE10',
    status: 'in_progress',
    orderDate: '16 Out, 2024\n11:17 AM',
    orderType: 'Para Viagem',
    qty: 12,
    totalCents: 11080,
  },
  {
    id: '#926MN67',
    status: 'open',
    orderDate: '16 Out, 2024\n10:54 AM',
    customerName: 'Adi Nugroho',
    orderType: 'No Local',
  },
  {
    id: '#201OE10',
    status: 'completed',
    orderDate: '16 Out, 2024\n11:15 AM',
    customerName: 'Lia Wijaya',
    orderType: 'No Local',
    qty: 3,
    totalCents: 1100,
  },
];
