import { useEffect, useState } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function breakpointOf(w: number): Breakpoint {
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function useLayout() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  );

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      // Coalesce bursts de resize num frame e só re-renderiza quando o
      // breakpoint efetivamente muda (os consumidores só usam as faixas).
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setWidth((prev) =>
          breakpointOf(prev) === breakpointOf(window.innerWidth) ? prev : window.innerWidth,
        );
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    headerPad: isMobile ? '10px 14px' : '12px 32px',
    headerPadX: isMobile ? '14px' : '32px',
    headerGap: isMobile ? '10px' : '24px',
    mainPad: isMobile ? '14px' : isTablet ? '20px 24px 32px' : '24px 32px 40px',
    /** Home: sem padding-top para o hero encostar na navbar. */
    mainPadHome: isMobile ? '0 14px 14px' : isTablet ? '0 24px 32px' : '0 32px 40px',
    /** Padding horizontal da home (px) — alinha full-bleed do sticky de categorias. */
    homePadX: isMobile ? 14 : isTablet ? 24 : 32,
    showNavLinks: !isMobile,
    heroH: isMobile ? 242 : isTablet ? 330 : 396,
    cardMin: isMobile ? '150px' : isTablet ? '180px' : '210px',
    pdpCols: isMobile
      ? '1fr'
      : isTablet
        ? 'minmax(0,1.2fr) minmax(0,1fr) 280px'
        : 'minmax(0,1.5fr) minmax(0,1fr) 330px',
    listCols: isMobile ? '1fr' : isTablet ? '220px minmax(0,1fr)' : '250px minmax(0,1fr)',
    cartCols: isMobile ? '1fr' : 'minmax(0,1fr) 340px',
    detailCols: isMobile ? '1fr' : 'minmax(0,1fr) 320px',
    ordersCols: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
    showSearchSidebar: !isMobile,
    showFilterBtn: isMobile,
    chatBubbleMax: isMobile ? '280px' : isTablet ? '420px' : '560px',
    subPageWidth: (variant: 'narrow' | 'default' | 'wide' = 'default') => {
      if (variant === 'narrow') return 'max-w-[520px]';
      if (variant === 'wide') return isMobile ? 'max-w-none' : isTablet ? 'max-w-[960px]' : 'max-w-[1280px]';
      return isMobile ? 'max-w-none' : isTablet ? 'max-w-[720px]' : 'max-w-[960px]';
    },
  };
}
