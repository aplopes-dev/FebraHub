import { ComunicacaoNav } from '@/features/clinic/marketing/components/comunicacao-nav';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Breakout do `p-4` da main (como configuracoes): cresce com o conteúdo e deixa
  // a `main` scrollar — as abas sobem e somem. Sem overflow interno (senão as abas ficam fixas).
  return (
    <div className="-m-4 flex min-h-[calc(100%+2rem)] min-w-0 flex-1 flex-col">
      <div className="shrink-0">
        <ComunicacaoNav />
      </div>
      <div className="flex flex-1 flex-col bg-muted">{children}</div>
    </div>
  );
}
