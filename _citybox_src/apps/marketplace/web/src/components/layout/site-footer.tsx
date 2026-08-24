import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BrandMark } from '@/components/brand/logo';
import { routes } from '@/lib/routes';

export function SiteFooter() {
  const { t } = useTranslation(['legal', 'footer', 'nav', 'common']);

  return (
    <footer className="mt-2 bg-brand text-white/75">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-7 px-8 py-9">
        <div>
          <div className="mb-3">
            <BrandMark logoSize={26} />
          </div>
          <p className="m-0 max-w-[240px] text-xs leading-relaxed">{t('footer.tagline', { ns: 'legal' })}</p>
        </div>
        <FooterColumn
          title={t('about.title', { ns: 'footer' })}
          links={[
            { label: t('about.citybox', { ns: 'footer' }), to: routes.staticPage('sobre') },
            { label: t('about.careers', { ns: 'footer' }), to: routes.staticPage('trabalhe-conosco') },
            {
              label: t('about.sustainability', { ns: 'footer' }),
              to: routes.staticPage('sustentabilidade'),
            },
          ]}
        />
        <FooterColumn
          title={t('help.title', { ns: 'footer' })}
          links={[
            { label: t('help.center', { ns: 'footer' }), to: routes.staticPage('ajuda') },
            { label: t('help.howToBuy', { ns: 'footer' }), to: routes.staticPage('como-comprar') },
            { label: t('help.returns', { ns: 'footer' }), to: routes.staticPage('devolucoes') },
          ]}
        />
        <FooterColumn
          title={t('account.title', { ns: 'footer' })}
          links={[
            { label: t('myAccount', { ns: 'nav' }), to: routes.account },
            { label: t('orders', { ns: 'nav' }), to: routes.orders },
            { label: t('favorites', { ns: 'nav' }), to: routes.favorites },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-8 py-4 text-xs text-white/50">
          <span>{t('footer.copyright', { ns: 'legal' })}</span>
          <div className="flex flex-wrap gap-4">
            <Link to={routes.staticPage('termos')} className="hover:text-white hover:underline">
              {t('pageTitles.terms', { ns: 'legal' })}
            </Link>
            <Link to={routes.staticPage('privacidade')} className="hover:text-white hover:underline">
              {t('pageTitles.privacy', { ns: 'legal' })}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <div className="mb-3 text-[13px] font-bold text-white">{title}</div>
      <div className="flex flex-col gap-2 text-[13px]">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="cursor-pointer hover:text-white hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
