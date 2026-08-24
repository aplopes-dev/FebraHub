import { FinanceiroNav } from "@/features/financeiro/components/financeiro-nav";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <FinanceiroNav />
      <div className="flex flex-col gap-6 p-2 pt-6">{children}</div>
    </div>
  );
}
