import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cityboxApi } from '@/api/citybox-api';
import type { ApiBanner } from '@/api/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/layout-primitives';
import { CategoryIcon } from '@/components/home/category-icon';
import { useCatalog } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { useShipToCity } from '@/hooks/useShipToLabel';
import { routes } from '@/lib/routes';

type BannerWithSubtitle = ApiBanner & { subtitle?: string; action?: { type?: string; value?: string; query?: string } };

export function HeroBanner() {
  const { t } = useTranslation('catalog');
  const navigate = useNavigate();
  const { heroH, headerPadX } = useLayout();
  const shipToCity = useShipToCity();
  const [banner, setBanner] = useState<BannerWithSubtitle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    cityboxApi
      .getBanners()
      .then((banners) => {
        if (!cancelled) setBanner((banners[0] as BannerWithSubtitle | undefined) ?? null);
      })
      .catch(() => {
        if (!cancelled) setBanner(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAction = () => {
    const action = banner?.action;
    if (action?.type === 'ROUTE' && action.value) {
      navigate(action.value);
      return;
    }
    if (action?.type === 'SEARCH' && action.query) {
      navigate(`/busca?q=${encodeURIComponent(action.query)}`);
      return;
    }
    navigate(routes.search);
  };

  if (loading) {
    return (
      <section
        className="relative flex w-full items-center overflow-hidden rounded-none bg-black/[0.06]"
        style={{ minHeight: heroH }}
      >
        <p
          className="relative z-[1] mx-auto w-full max-w-[1280px] py-5 text-sm text-muted-foreground md:py-6"
          style={{ paddingLeft: headerPadX, paddingRight: headerPadX }}
        >
          {t('banner.loading')}
        </p>
      </section>
    );
  }

  // Conteúdo do hero: usa dados da API quando existirem, com fallback sem cidade fixa.
  const eyebrow = banner?.subtitle || 'Até 40% off em tecnologia';
  const title = banner?.title || 'Ofertas do dia';
  const apiDescription = (banner as (BannerWithSubtitle & { description?: string }) | null)
    ?.description;
  const description =
    apiDescription ||
    (shipToCity
      ? `Milhares de itens em promoção nas lojas de ${shipToCity}, num só carrinho.`
      : 'Milhares de itens em promoção, num só carrinho.');
  // Poster estático (imagem da API tem precedência); vídeo de fundo em loop.
  const heroPoster = banner?.imageUrl || '/assets/home/hero-poster.jpg';

  return (
    <section
      className="relative flex w-full items-center overflow-hidden rounded-none bg-gradient-to-br from-[#2b2b2f] to-brand"
      style={{ minHeight: heroH }}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <video
          className="size-full object-cover"
          src="/assets/home/hero.mp4"
          poster={heroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.32),rgba(0,0,0,0.30))]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-transparent" aria-hidden />
      <div
        className="hero-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 h-[155px] md:h-[185px] lg:h-[220px]"
        aria-hidden
      />
      <div
        className="relative z-[1] mx-auto w-full max-w-[1280px] py-5 md:py-6"
        style={{ paddingLeft: headerPadX, paddingRight: headerPadX }}
      >
        <div className="max-w-[560px]">
          <div className="text-[13px] font-extrabold tracking-[0.12em] text-white/70 uppercase">
            {eyebrow}
          </div>
          <h1 className="my-2 text-[clamp(30px,6vw,52px)] leading-[1.03] font-extrabold tracking-tight text-white">
            {title}
          </h1>
          <p className="m-0 max-w-[420px] text-[15px] leading-[1.5] text-white/70">{description}</p>
          <div className="mt-[18px] flex items-center gap-[14px]">
            <Button
              variant="secondary"
              className="h-auto rounded-lg bg-white px-[22px] py-3 text-[15px] font-bold text-brand hover:bg-white/90"
              onClick={handleAction}
            >
              {t('banner.cta')}
            </Button>
            <HeroCountdown />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Contagem regressiva até o fim do dia (reinicia diariamente), estilo "termina em HH:MM:SS". */
function HeroCountdown() {
  const [remaining, setRemaining] = useState(() => secondsUntilEndOfDay());

  useEffect(() => {
    const id = setInterval(() => setRemaining(secondsUntilEndOfDay()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <span className="flex items-center gap-[7px] text-[13px] font-bold text-white/80">
      <span className="size-[7px] rounded-full bg-[#00a650]" aria-hidden />
      termina em {hh}:{mm}:{ss}
    </span>
  );
}

function secondsUntilEndOfDay() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

/** Tamanho dos ícones de categoria na Home (referência: tecnologia). */
const CATEGORY_ICON_SIZE = 64;

export function ShortcutsRow({
  onShortcutClick,
  className,
}: {
  onShortcutClick: (categoryId?: string) => void;
  className?: string;
}) {
  const { categories } = useCatalog();
  const { isMobile, homePadX } = useLayout();
  const { t } = useTranslation('catalog');
  const shortcuts = categories.map((c) => ({
    label: c.name.includes('.') ? t(`categories.${c.id}`) : c.name,
    categoryId: c.id,
  }));

  return (
    <div
      className={cn(
        'sticky z-30 bg-surface',
        isMobile
          ? 'mb-6 flex gap-3 overflow-x-auto pb-3 pt-2'
          : 'mb-6 grid grid-cols-4 gap-4 pb-3 pt-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8',
        className,
      )}
      style={{
        top: 'var(--site-header-height, 56px)',
        marginLeft: -homePadX,
        marginRight: -homePadX,
        paddingLeft: homePadX,
        paddingRight: homePadX,
      }}
    >
      {shortcuts.map((s) => (
        <button
          key={s.categoryId}
          type="button"
          className={
            isMobile
              ? 'group flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-1'
              : 'group flex cursor-pointer flex-col items-center gap-1'
          }
          onClick={() => onShortcutClick(s.categoryId)}
        >
          <div
            className="flex shrink-0 items-center justify-center transition-all duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-1 group-hover:drop-shadow-[0_6px_16px_rgba(0,0,0,0.20)]"
            style={{ width: CATEGORY_ICON_SIZE, height: CATEGORY_ICON_SIZE }}
          >
            <CategoryIcon id={s.categoryId} size={CATEGORY_ICON_SIZE} />
          </div>
          <span className="text-center text-xs leading-snug text-black/70 transition-opacity duration-200 opacity-70 group-hover:opacity-100">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Card de categoria com imagem de fundo (layout "Explore por categoria"). */
const SHOWCASE_CATEGORIES: { id: string; label: string; meta: string; img: string }[] = [
  { id: 'supermercado', label: 'Mercado', meta: 'entrega em 40 min', img: '/assets/home/cat-supermercado.jpg' },
  { id: 'moda', label: 'Moda', meta: '1.240 peças novas', img: '/assets/home/cat-moda.jpg' },
  { id: 'tecnologia', label: 'Tecnologia', meta: 'até 40% off', img: '/assets/home/cat-tecnologia.jpg' },
  { id: 'casa', label: 'Casa', meta: '320 lojas locais', img: '/assets/home/cat-casa.jpg' },
  { id: 'beleza', label: 'Beleza', meta: 'novidades toda semana', img: '/assets/home/cat-beleza.jpg' },
  { id: 'esportes', label: 'Esportes', meta: 'frete grátis hoje', img: '/assets/home/cat-esportes.jpg' },
];

export function CategoryShowcase({
  onSelect,
  className,
}: {
  onSelect: (id?: string) => void;
  className?: string;
}) {
  const { homePadX } = useLayout();
  const shipToCity = useShipToCity();
  const cardHeight = 'h-[190px] sm:h-[230px] lg:h-[280px]';

  return (
    <section
      className={cn('relative z-[2] mt-3.5 mb-6', className)}
      style={{ marginLeft: -homePadX, marginRight: -homePadX, paddingLeft: homePadX, paddingRight: homePadX }}
    >
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="m-0 text-[22px] font-extrabold tracking-tight text-[rgba(0,0,0,0.9)]">
            Explore por categoria
          </h2>
          {shipToCity ? (
            <p className="mt-1 mb-0 text-[13px] text-black/55">
              Lojas locais de {shipToCity}, num só carrinho
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="cursor-pointer text-sm font-bold text-foreground"
          onClick={() => onSelect()}
        >
          Ver todas →
        </button>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {SHOWCASE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              'group relative block overflow-hidden rounded-2xl bg-black text-left shadow-[0_1px_6px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.26)]',
              cardHeight,
            )}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
              style={{ backgroundImage: `url('${c.img}')` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.42)_42%,rgba(0,0,0,0)_78%)]" aria-hidden />
            <div className="absolute right-3.5 bottom-4 left-4 text-white">
              <div className="truncate text-[clamp(15px,1.35vw,19px)] font-extrabold tracking-tight">
                {c.label}
              </div>
              <div className="mt-1 text-[12.5px] font-semibold leading-tight text-white/70">{c.meta}</div>
            </div>
          </button>
        ))}

        {/* Card de Cupons */}
        <button
          type="button"
          onClick={() => onSelect('cupons')}
          className={cn(
            'group relative block overflow-hidden rounded-2xl bg-[#0a0a0a] text-left shadow-[0_1px_6px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.3)]',
            cardHeight,
          )}
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-55"
            style={{ backgroundImage: "url('/assets/home/cat-cupons.jpg')" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(0,0,0,0.92),rgba(0,0,0,0.55))]" aria-hidden />
          <div className="pointer-events-none absolute inset-[7px] rounded-[11px] border border-dashed border-white/30" aria-hidden />
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <span className="rounded-b-lg bg-white px-2.5 py-1 text-[10px] font-extrabold tracking-[0.08em] text-[#111] uppercase">
              exclusivo
            </span>
          </div>
          <div className="absolute right-3.5 bottom-4 left-4 text-white">
            <div className="text-[clamp(24px,2.3vw,32px)] font-extrabold leading-none tracking-tight">R$50</div>
            <div className="mt-[5px] text-[clamp(15px,1.35vw,19px)] font-extrabold tracking-tight">Cupons</div>
            <div className="mt-1 text-[12.5px] font-semibold text-white/70">3 ativos pra você</div>
          </div>
        </button>
      </div>
    </section>
  );
}

export function DailyOffersSection({
  children,
  onViewAll,
}: {
  children: React.ReactNode;
  onViewAll: () => void;
}) {
  const { t } = useTranslation('catalog');

  return (
    <ProductSection title={t('sections.dailyOffers')} onViewAll={onViewAll}>
      {children}
    </ProductSection>
  );
}

export function ProductSection({
  title,
  children,
  onViewAll,
}: {
  title: string;
  children: React.ReactNode;
  onViewAll?: () => void;
}) {
  const { t } = useTranslation('catalog');

  return (
    <PanelCard className="mb-6 p-[clamp(16px,3vw,28px)]">
      <div className="mb-[18px] flex items-center justify-between">
        <h2 className="m-0 text-[clamp(18px,3vw,24px)] font-extrabold tracking-tight text-[rgba(0,0,0,0.9)]">
          {title}
        </h2>
        {onViewAll && (
          <button type="button" className="cursor-pointer text-sm font-bold text-foreground" onClick={onViewAll}>
            {t('sections.viewAll')}
          </button>
        )}
      </div>
      {children}
    </PanelCard>
  );
}
