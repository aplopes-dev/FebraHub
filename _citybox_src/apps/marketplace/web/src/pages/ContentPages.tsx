import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PanelCard } from '@/components/shared/layout-primitives';
import { SubPageLayout } from '@/components/shared/sub-page-layout';
import {
  CONTENT_PAGES,
  isContentPageSlug,
  LEGACY_STATIC_TO_SLUG,
  type ContentPageSlug,
  type LegacyStaticPageType,
} from '@/data/content-pages';
import { screenLabel } from '@/i18n';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

function resolveSlug(raw: string | undefined): ContentPageSlug | null {
  if (!raw) return null;
  if (isContentPageSlug(raw)) return raw;
  if (raw in LEGACY_STATIC_TO_SLUG) {
    return LEGACY_STATIC_TO_SLUG[raw as LegacyStaticPageType];
  }
  return null;
}

export function ContentPageView({
  slug: slugProp,
  backTo = routes.home,
  className,
}: {
  slug?: ContentPageSlug | LegacyStaticPageType | string;
  backTo?: string;
  className?: string;
}) {
  const { t } = useTranslation('common');
  const params = useParams<{ slug: string }>();
  const slug = resolveSlug(slugProp ?? params.slug);

  const page = useMemo(() => (slug ? CONTENT_PAGES[slug] : null), [slug]);

  if (!page || !slug) {
    return (
      <div data-screen-label={screenLabel('staticPage')} className={className}>
        <SubPageLayout title={t('notFound', { defaultValue: 'Página não encontrada' })} backTo={backTo}>
          <PanelCard className="p-5">
            <p className="m-0 text-sm text-muted-foreground">
              O conteúdo que você procura não está disponível.
            </p>
          </PanelCard>
        </SubPageLayout>
      </div>
    );
  }

  return (
    <div data-screen-label={screenLabel('staticPage')} className={className}>
      <SubPageLayout title={page.title} backTo={backTo} width="wide">
        <div className="flex flex-col gap-4">
          {page.lead ? (
            <PanelCard className="p-5 md:p-6">
              <p className="m-0 text-[15px] leading-relaxed text-[rgba(0,0,0,0.8)]">{page.lead}</p>
            </PanelCard>
          ) : null}
          {page.sections.map((section, index) => (
            <PanelCard key={`${slug}-${index}`} className="p-5 md:p-6">
              {section.title ? (
                <h2 className="mt-0 mb-2 text-base font-extrabold text-[rgba(0,0,0,0.9)]">
                  {section.title}
                </h2>
              ) : null}
              <p
                className={cn(
                  'm-0 text-sm leading-relaxed text-[rgba(0,0,0,0.8)]',
                  !section.title && 'text-[15px]',
                )}
              >
                {section.body}
              </p>
            </PanelCard>
          ))}
        </div>
      </SubPageLayout>
    </div>
  );
}

/** Compat com rotas antigas que passam type=about|terms|privacy. */
export function StaticPage({
  type,
  backTo = routes.account,
}: {
  type: LegacyStaticPageType | ContentPageSlug;
  backTo?: string;
}) {
  const fromAuth = backTo === routes.login;
  return (
    <ContentPageView
      slug={type}
      backTo={backTo}
      className={fromAuth ? 'min-h-screen bg-surface px-4 py-6 md:py-10' : undefined}
    />
  );
}
