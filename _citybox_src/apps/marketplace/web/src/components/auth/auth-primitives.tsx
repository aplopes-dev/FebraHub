import type { InputHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/logo';
import { useLayout } from '@/hooks/useLayout';
import { cn } from '@/lib/utils';

export function AuthField({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-[52px] w-full rounded-lg bg-white px-4 text-[15px] text-[rgba(0,0,0,0.9)] outline-none placeholder:text-black/40',
        className,
      )}
    />
  );
}

function AuthMarketingPanel() {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="relative hidden flex-1 flex-col justify-center bg-gradient-to-br from-[#161616] via-[#1a1a1a] to-brand/25 px-10 xl:px-16 lg:flex">
      <Logo size={88} />
      <h2 className="mt-8 text-[clamp(28px,3vw,40px)] font-extrabold">{t('brand', { ns: 'common' })}</h2>
      <p className="mt-4 max-w-md text-[clamp(15px,2vw,18px)] leading-relaxed text-white/70">
        {t('marketing.tagline')}
      </p>
      <ul className="mt-8 flex flex-col gap-3 text-sm text-white/60">
        <li>✦ {t('marketing.benefit1')}</li>
        <li>✦ {t('marketing.benefit2')}</li>
        <li>✦ {t('marketing.benefit3')}</li>
      </ul>
    </div>
  );
}

export function AuthPageShell({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const { isMobile } = useLayout();

  if (isMobile) {
    return (
      <div className={cn('flex min-h-screen flex-col bg-[#111111] text-white', className)}>
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        {footer}
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-screen bg-[#111111] text-white', className)}>
      <AuthMarketingPanel />
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 md:px-10">
        <div className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl">
          {children}
        </div>
        {footer && <div className="mt-5 w-full max-w-[440px] text-center">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthFormScaffold({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const { isMobile } = useLayout();

  const header = (
    <div className={cn('flex items-center gap-3', isMobile ? 'pb-6 pt-12' : 'pb-6')}>
      <button type="button" className="cursor-pointer text-2xl leading-none" onClick={onBack}>
        ←
      </button>
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );

  const body = (
    <>
      {header}
      <div className="flex flex-col gap-3">{children}</div>
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#111111] px-[26px] pb-8 text-white">
        {body}
      </div>
    );
  }

  return <AuthPageShell>{body}</AuthPageShell>;
}
