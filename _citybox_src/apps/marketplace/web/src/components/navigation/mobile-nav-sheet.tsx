import { Menu, User, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth, useUI } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { routes } from '@/lib/routes';

export function MobileNavSheet() {
  const { t } = useTranslation(['nav', 'common']);
  const navigate = useNavigate();
  const { drawerOpen, openDrawer, closeDrawer } = useUI();
  const { user } = useAuth();
  const { isMobile } = useLayout();
  const firstName = user.name.split(' ')[0] || user.name;

  if (!isMobile) return null;

  const go = (path: string) => {
    closeDrawer();
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('a11y.menu', { ns: 'common' })}
        className="text-brand-foreground hover:bg-white/10 hover:text-brand-foreground"
        onClick={openDrawer}
      >
        <Menu className="size-[26px]" />
      </Button>
      <Sheet open={drawerOpen} onOpenChange={(open) => (open ? openDrawer() : closeDrawer())}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[290px] max-w-[84vw] animate-cbslide gap-0 p-0 sm:max-w-[290px]"
        >
          <SheetHeader className="bg-brand p-0 text-left text-brand-foreground">
            <div className="flex items-center gap-2.5 px-[18px] py-5">
              <BrandMark logoSize={28} showName={false} />
              <div>
                <SheetTitle className="text-[15px] font-extrabold text-white">
                  {t('greeting', { name: firstName })}
                </SheetTitle>
                <button type="button" className="text-xs opacity-80" onClick={() => go(routes.account)}>
                  {t('myAccount')}
                </button>
              </div>
            </div>
          </SheetHeader>
          <nav className="flex flex-col py-2">
            <button type="button" className="flex items-center gap-3 border-b border-black/5 px-[18px] py-3.5 text-[15px] font-bold" onClick={() => go(routes.account)}>
              <User className="size-[19px]" />
              {t('myAccount')}
            </button>
            <button type="button" className="flex items-center gap-3 border-b border-black/5 px-[18px] py-3.5 text-[15px] font-bold" onClick={() => go(routes.favorites)}>
              <Heart className="size-[19px]" />
              {t('favorites')}
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
