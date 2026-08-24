import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { notFound } from '../common/envelope.js';
import type { ConsumerUserRecord } from '../users/users.service.js';

interface ReviewRow {
  id: string;
  productId: string;
  author: string;
  rating: number;
  text: string;
  photoUrls: string[];
  date: Date;
}

function toApiReview(row: ReviewRow) {
  return {
    id: row.id,
    productId: row.productId,
    author: row.author,
    rating: row.rating,
    date: row.date.toISOString(),
    text: row.text,
    photoUrls: row.photoUrls,
  };
}

@Injectable()
export class ReviewsService {
  private readonly db = getConsumerClient();

  private async ensureProduct(productId: string) {
    const product = await this.db.product.findUnique({ where: { id: productId } });
    if (!product) throw notFound('Produto não encontrado');
    return product;
  }

  async list(productId: string, page: number, pageSize: number) {
    await this.ensureProduct(productId);

    const [all, rows] = await Promise.all([
      this.db.review.findMany({
        where: { productId },
        select: { rating: true },
      }),
      this.db.review.findMany({
        where: { productId },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let sum = 0;
    for (const r of all) {
      distribution[String(r.rating)] = (distribution[String(r.rating)] ?? 0) + 1;
      sum += r.rating;
    }
    const totalCount = all.length;
    const averageRating = totalCount === 0 ? 0 : Math.round((sum / totalCount) * 100) / 100;

    return {
      data: {
        averageRating,
        totalCount,
        distribution,
        reviews: rows.map(toApiReview),
      },
      meta: { page, pageSize, total: totalCount },
    };
  }

  async create(
    productId: string,
    user: ConsumerUserRecord,
    input: { rating: number; text: string; photoUrls?: string[] },
  ) {
    await this.ensureProduct(productId);

    const review = await this.db.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId,
          userId: user.id,
          author: user.name,
          rating: input.rating,
          text: input.text,
          photoUrls: input.photoUrls ?? [],
        },
      });
      const agg = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: {
          rating: Math.round((agg._avg.rating ?? 0) * 100) / 100,
          reviewCount: agg._count._all,
        },
      });
      return created;
    });

    return { review: toApiReview(review) };
  }

  async addPhotos(productId: string, reviewId: string, photoUrls: string[]) {
    const review = await this.db.review.findFirst({ where: { id: reviewId, productId } });
    if (!review) throw notFound('Avaliação não encontrada');

    const updated = await this.db.review.update({
      where: { id: reviewId },
      data: { photoUrls: [...review.photoUrls, ...photoUrls] },
    });
    return {
      photoUrl: photoUrls[photoUrls.length - 1] ?? null,
      review: toApiReview(updated),
    };
  }
}
