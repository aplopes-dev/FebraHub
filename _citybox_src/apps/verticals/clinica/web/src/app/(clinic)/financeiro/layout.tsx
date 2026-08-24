import { FinancialNav } from "@/features/clinic/financeiro/components/financial-nav";

export default function FinancialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Mobile: altura pelo conteúdo (scroll no shell). Desktop: preenche viewport com scroll interno.
    <div className="flex min-w-0 flex-col md:min-h-0 md:flex-1">
      <div className="shrink-0">
        <FinancialNav />
      </div>
      <div className="flex flex-col pt-4 pb-4 md:min-h-0 md:flex-1 md:overflow-hidden">
        {children}
      </div>
    </div>
  );
}
