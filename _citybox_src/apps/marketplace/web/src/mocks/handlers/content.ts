import { http, type HttpHandler } from 'msw';
import i18n from '@/i18n';
import {
  CONTENT_PAGES,
  isContentPageSlug,
  LEGACY_STATIC_TO_SLUG,
  type ContentPageSlug,
} from '@/data/content-pages';
import { errorResponse, ok } from './shared';

function resolveContentSlug(raw: string): ContentPageSlug | null {
  if (isContentPageSlug(raw)) return raw;
  if (raw in LEGACY_STATIC_TO_SLUG) {
    return LEGACY_STATIC_TO_SLUG[raw as keyof typeof LEGACY_STATIC_TO_SLUG];
  }
  return null;
}

function flattenPageContent(slug: ContentPageSlug): string {
  const page = CONTENT_PAGES[slug];
  const parts = [
    page.lead,
    ...page.sections.map((section) =>
      section.title ? `${section.title}\n${section.body}` : section.body,
    ),
  ].filter(Boolean);
  return parts.join('\n\n');
}

export const contentHandlers: HttpHandler[] = [
  http.get('*/', () =>
    ok({
      status: 'ok',
      message: i18n.t('bffMessage', { ns: 'api' }),
      docs: '/docs/api.html',
    }),
  ),

  http.get('*/health', () => ok({ status: 'healthy' })),

  http.get('*/content/pages/:slug', ({ params }) => {
    const raw = String(params.slug);
    const slug = resolveContentSlug(raw);
    if (!slug) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.page');
    }
    const page = CONTENT_PAGES[slug];
    return ok({
      slug,
      title: page.title,
      content: flattenPageContent(slug),
      updatedAt: '2026-07-26T00:00:00.000Z',
    });
  }),

  http.get('*/content/banners', () =>
    ok({
      banners: [
        {
          id: 'banner-deals',
          title: i18n.t('content.dealsBannerTitle', { ns: 'api' }),
          subtitle: i18n.t('content.dealsBannerSubtitle', { ns: 'api' }),
          imageUrl: '/assets/banners/home-hero.png',
          action: { type: 'ROUTE', value: '/categoria/ofertas' },
        },
        {
          id: 'banner-plus',
          title: i18n.t('content.plusBannerTitle', { ns: 'api' }),
          subtitle: i18n.t('content.plusBannerSubtitle', { ns: 'api' }),
          imageUrl: '/banners/plus.svg',
          action: { type: 'ROUTE', value: '/assinatura' },
        },
      ],
    }),
  ),
];
