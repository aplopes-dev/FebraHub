import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/AppContext';
import { routes } from '@/lib/routes';

export function CartNavButton() {
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const { cartCount } = useCart();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t('cart')}
      className="relative shrink-0 text-brand-foreground hover:bg-white/10 hover:text-brand-foreground"
      onClick={() => navigate(routes.cart)}
    >
      <ShoppingCart className="size-[26px] stroke-[1.8]" />
      {cartCount > 0 && (
        <span className="absolute -top-1.5 -right-2 flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-extrabold text-brand">
          {cartCount}
        </span>
      )}
    </Button>
  );
}
