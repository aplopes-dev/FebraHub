import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '@/hooks/useLayout';
import { cn } from '@/lib/utils';

export function SubPageLayout({
  title,
  backTo,
  children,
  className,
  width = 'default',
}: {
  title: string;
  backTo?: string;
  children: React.ReactNode;
  className?: string;
  width?: 'narrow' | 'default' | 'wide';
}) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { isMobile, subPageWidth } = useLayout();

  return (
    <div className={cn('mx-auto w-full', subPageWidth(width), className)}>
      <div className={cn('mb-5 flex items-center gap-3', !isMobile && 'mb-6')}>
        <button
          type="button"
          aria-label={t('a11y.back')}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-black/5"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="m-0 text-[clamp(20px,3vw,28px)] font-extrabold text-[rgba(0,0,0,0.9)]">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function FormInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-11 rounded-lg border border-black/10 bg-white px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20',
        className,
      )}
      {...props}
    />
  );
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:[&>button]:min-w-[140px] md:[&>button]:flex-1">
      {children}
    </div>
  );
}

export function ListActionRow({
  onClick,
  children,
  danger,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 px-[18px] py-4 text-left',
        danger && 'text-destructive',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
