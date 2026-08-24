import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { PRODUCT_INCLUDE, toApiProduct } from '../catalog/product.presenter.js';

@Injectable()
export class FavoritesService {
  private readonly db = getConsumerClient();

  async list(userId: string) {
    const favorites = await this.db.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: PRODUCT_INCLUDE } },
    });
    const published = favorites.filter((f) => f.product.published);
    return {
      productIds: published.map((f) => f.productId),
      products: published.map((f) => toApiProduct(f.product)),
    };
  }

  /** Define o estado desejado (contrato web envia { isFavorite }). */
  async setFavorite(userId: string, productId: string, isFavorite: boolean) {
    if (isFavorite) {
      const product = await this.db.product.findFirst({
        where: { id: productId, published: true },
      });
      if (product) {
        await this.db.favorite.upsert({
          where: { userId_productId: { userId, productId } },
          update: {},
          create: { userId, productId },
        });
      }
      return { productId, isFavorite: Boolean(product) };
    }
    await this.db.favorite.deleteMany({ where: { userId, productId } });
    return { productId, isFavorite: false };
  }
}
