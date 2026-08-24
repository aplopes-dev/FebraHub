import { useTranslation } from 'react-i18next';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 30, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 143 143"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="143" height="143" rx="34" fill="black" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M71.463 30.2278L108.045 44.3509L71.463 58.4776L34.8813 44.3509L71.463 30.2278Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.8779 88.8172L68.1202 109.623V67.1577L53.1723 57.5152L34.8797 45.7175L34.8779 69.3155V88.8172Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M108.049 88.8199L74.8052 109.623V67.1577L89.7531 57.5152L108.047 45.7175L108.049 69.3155V88.8199Z"
        fill="white"
      />
    </svg>
  );
}

export function BrandMark({ showName = true, logoSize = 30 }: { showName?: boolean; logoSize?: number }) {
  const { t } = useTranslation('common');

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Logo size={logoSize} />
      {showName && (
        <span className="text-xl font-extrabold tracking-tight text-inherit">{t('brand')}</span>
      )}
    </div>
  );
}
