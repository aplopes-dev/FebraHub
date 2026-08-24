import type { ReactNode } from 'react';

type LojaPageFrameProps = {
  children: ReactNode;
};

/** Fundo cinza full-bleed (mesmo padrão do dashboard), cancela o `p-4` da main. */
export function LojaPageFrame({ children }: LojaPageFrameProps) {
  return (
    <div className="-m-4 min-h-[calc(100%+2rem)] shrink-0 bg-[color-mix(in_oklch,var(--foreground)_6%,var(--background))] p-4">
      {children}
    </div>
  );
}
