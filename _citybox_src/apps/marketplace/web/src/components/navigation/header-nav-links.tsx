import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AppContext';
import { routes } from '@/lib/routes';

export function HeaderNavLinks() {
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user.name.split(' ')[0] || user.name;

  return (
    <nav className="flex shrink-0 items-center gap-5 text-sm">
      <button type="button" className="cursor-pointer whitespace-nowrap opacity-90" onClick={() => navigate(routes.account)}>
        {t('greeting', { name: firstName })}
      </button>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-1.5 opacity-90"
        onClick={() => navigate(routes.favorites)}
      >
        <Heart className="size-4" />
        {t('favorites')}
      </button>
      <button type="button" className="cursor-pointer opacity-90" onClick={() => navigate(routes.orders)}>
        {t('orders')}
      </button>
    </nav>
  );
}
