import { Injectable } from '@nestjs/common';
import { ApiError } from '../common/envelope.js';
import { money } from '../common/money.js';
import { InjectService } from '../common/inject.js';
import { getConsumerClient } from '../database/consumer.js';
import { CacheService } from '../cache/cache.service.js';
import { PRODUCT_INCLUDE, toApiProduct } from '../catalog/product.presenter.js';
import type { ApiCart } from '../checkout/checkout.pricing.js';

const CART_CACHE_TTL_SEC = 3600;
const MAX_QUANTITY = 99;

const cartKey = (userId: string) => `cart:${userId}`;

/**
 * Carrinho por usuário — Postgres (Cart/CartItem) como fonte de verdade,
 * Redis como cache (`cart:{userId}`, TTL 3600s, invalidado em toda mutação).
 */
@Injectable()
export class CartService {
  private readonly db = getConsumerClient();

  constructor(@InjectService(CacheService) private readonly cache: CacheService) {}

  async getCart(userId: string): Promise<ApiCart> {
    const cached = await this.cache.get<ApiCart>(cartKey(userId));
    if (cached) return cached;
    const cart = await this.buildCart(userId);
    await this.cache.set(cartKey(userId), cart, CART_CACHE_TTL_SEC);
    return cart;
  }

  /** Monta o ApiCart direto do Postgres (sem cache). */
  async buildCart(userId: string): Promise<ApiCart> {
    const rows = await this.db.cartItem.findMany({
      where: { cartUserId: userId },
      include: { product: { include: PRODUCT_INCLUDE } },
      orderBy: { productId: 'asc' },
    });
    const items = rows.map((row) => ({
      productId: row.productId,
      quantity: row.quantity,
      product: toApiProduct(row.product),
    }));
    const subtotal = money(
      items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0),
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, itemCount, subtotal };
  }

  async invalidate(userId: string) {
    await this.cache.del(cartKey(userId));
  }

  /** Cupom aplicado no carrinho (sincronizado com o CheckoutSession). */
  async couponCode(userId: string): Promise<string | null> {
    const cart = await this.db.cart.findUnique({ where: { userId } });
    return cart?.couponCode ?? null;
  }

  async setCouponCode(userId: string, code: string | null) {
    await this.db.cart.upsert({
      where: { userId },
      update: { couponCode: code },
      create: { userId, couponCode: code },
    });
    await this.db.checkoutSession.updateMany({
      where: { userId },
      data: { couponCode: code },
    });
    await this.invalidate(userId);
  }

  async addItem(userId: string, productId: string | undefined, quantity: number | undefined) {
    if (!productId) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Campo obrigatório', 'productId');
    }
    const qty = quantity ?? 1;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Quantidade inválida', 'quantity');
    }
    const product = await this.db.product.findFirst({
      where: { id: productId, published: true },
    });
    if (!product) throw new ApiError(404, 'NOT_FOUND', 'Produto não encontrado');

    await this.db.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    const current = await this.db.cartItem.findUnique({
      where: { cartUserId_productId: { cartUserId: userId, productId } },
    });
    const next = Math.min(MAX_QUANTITY, (current?.quantity ?? 0) + qty);
    await this.db.cartItem.upsert({
      where: { cartUserId_productId: { cartUserId: userId, productId } },
      update: { quantity: next },
      create: { cartUserId: userId, productId, quantity: next },
    });
    await this.invalidate(userId);
    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number | undefined) {
    if (quantity == null || !Number.isInteger(quantity)) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Quantidade inválida', 'quantity');
    }
    if (quantity <= 0) return this.removeItem(userId, productId);
    if (quantity > MAX_QUANTITY) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Quantidade inválida', 'quantity');
    }
    const current = await this.db.cartItem.findUnique({
      where: { cartUserId_productId: { cartUserId: userId, productId } },
    });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Item não encontrado no carrinho');

    await this.db.cartItem.update({
      where: { cartUserId_productId: { cartUserId: userId, productId } },
      data: { quantity },
    });
    await this.invalidate(userId);
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    await this.db.cartItem.deleteMany({ where: { cartUserId: userId, productId } });
    await this.invalidate(userId);
    return this.getCart(userId);
  }

  /** Limpa itens e cupom (também remove o cupom do CheckoutSession, como o mock). */
  async clear(userId: string) {
    await this.db.$transaction([
      this.db.cartItem.deleteMany({ where: { cartUserId: userId } }),
      this.db.cart.updateMany({ where: { userId }, data: { couponCode: null } }),
      this.db.checkoutSession.updateMany({ where: { userId }, data: { couponCode: null } }),
    ]);
    await this.invalidate(userId);
  }

  /** Adiciona itens de um pedido ao carrinho (buy-again) — só produtos published. */
  async addOrderItems(userId: string, items: Array<{ productId: string; quantity: number }>) {
    const published = await this.db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, published: true },
      select: { id: true },
    });
    const publishedIds = new Set(published.map((p) => p.id));
    await this.db.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    for (const item of items) {
      if (!publishedIds.has(item.productId)) continue;
      const current = await this.db.cartItem.findUnique({
        where: { cartUserId_productId: { cartUserId: userId, productId: item.productId } },
      });
      const next = Math.min(MAX_QUANTITY, (current?.quantity ?? 0) + item.quantity);
      await this.db.cartItem.upsert({
        where: { cartUserId_productId: { cartUserId: userId, productId: item.productId } },
        update: { quantity: next },
        create: { cartUserId: userId, productId: item.productId, quantity: next },
      });
    }
    await this.invalidate(userId);
    return this.getCart(userId);
  }
}
