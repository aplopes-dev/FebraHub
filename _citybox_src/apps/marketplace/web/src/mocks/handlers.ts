import type { HttpHandler } from 'msw';
import { accountHandlers } from './handlers/account';
import { authHandlers } from './handlers/auth';
import { cartHandlers } from './handlers/cart';
import { catalogHandlers } from './handlers/catalog';
import { checkoutHandlers } from './handlers/checkout';
import { contentHandlers } from './handlers/content';
import { engagementHandlers } from './handlers/engagement';
import { ordersHandlers } from './handlers/orders';

export const handlers: HttpHandler[] = [
  ...contentHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...ordersHandlers,
  ...engagementHandlers,
];
