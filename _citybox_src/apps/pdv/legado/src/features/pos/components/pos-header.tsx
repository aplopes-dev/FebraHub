'use client';

import { useState, useEffect } from 'react';
import { Button } from '@citybox/ui/atoms';
import { Logo } from '@citybox/ui/molecules';
import { MenuIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { usePosUi } from '../hooks/use-pos-ui';
import { PosSearchInput } from './pos-search-input';

export function PosHeader() {
  const pathname = usePathname();
  const isPosPage = pathname === '/' || pathname === '';
  const { searchQuery, setSearchQuery, openSideMenu } = usePosUi();
  const [dateTime, setDateTime] = useState('');
  /** null até hidratar — evita mismatch SSR vs navigator.onLine */
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncOnline = () => setIsOnline(navigator.onLine);
    syncOnline();

    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);

    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  const connectionKnown = isOnline !== null;
  const online = isOnline === true;

  return (
    <header className="pdv-header-bar flex shrink-0 items-center justify-between px-6 border-b border-[#e5e5e5] bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="pdv-header-menu-btn"
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            onClick={openSideMenu}
          >
            <MenuIcon className="size-6" aria-hidden />
          </Button>
          <Logo
            variant="full"
            className="h-8 w-auto shrink-0 text-foreground"
          />
        </div>

        <div className="h-4 w-px bg-[#e5e5e5] ml-2 shrink-0" />

        <div className="flex items-center gap-3.5 ml-1">
          <time className="text-sm font-medium text-[#525252] tabular-nums shrink-0">
            {dateTime || '\u00a0'}
          </time>

          <div
            className="flex items-center gap-1.5 bg-[#f7f7f7] border border-[#e5e5e5] px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs select-none"
            title={
              !connectionKnown
                ? 'Verificando conexão…'
                : online
                  ? 'Conectado à internet'
                  : 'Sem conexão com a internet'
            }
          >
            <span className="relative flex size-2 shrink-0">
              {!connectionKnown ? (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-300" />
              ) : online ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-400" />
              )}
            </span>
            <span className="text-[#525252] tracking-wider uppercase">
              {!connectionKnown ? '…' : online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {isPosPage && <PosSearchInput value={searchQuery} onChange={setSearchQuery} />}
    </header>
  );
}
