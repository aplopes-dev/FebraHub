import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { notFound } from '../common/envelope.js';

interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  actionType: string | null;
  actionQuery: string | null;
}

/** Molda Banner no shape ApiBanner (action { type, query } opcional). */
export function toApiBanner(row: BannerRow) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    imageUrl: row.imageUrl,
    action: row.actionType
      ? { type: row.actionType, query: row.actionQuery ?? undefined }
      : undefined,
  };
}

@Injectable()
export class ContentService {
  private readonly db = getConsumerClient();

  async listBanners() {
    const banners = await this.db.banner.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { banners: banners.map(toApiBanner) };
  }

  async getStaticPage(slug: string) {
    const page = await this.db.staticPage.findUnique({ where: { slug } });
    if (!page) throw notFound('Página não encontrada');
    return {
      slug: page.slug,
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt.toISOString(),
    };
  }
}
