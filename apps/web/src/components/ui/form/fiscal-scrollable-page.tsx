import type { ReactNode } from "react";
import { Page } from "@/components/ui/page";

export type FiscalScrollablePageProps = {
  children: ReactNode;
  /** Rodapé fixo fora da área de rolagem (ex.: barra de ação sticky). */
  footer?: ReactNode;
};

/**
 * Envelope do Menu Fiscal (spec erp/022, P2).
 *
 * Hoje é só um `Page` com outro nome: o envelope full-bleed + rolagem que ele
 * inventou virou o padrão de todas as telas. Fica no lugar porque as telas
 * fiscais o importam; telas novas usam `<Page>` direto.
 */
export function FiscalScrollablePage({
  children,
  footer,
}: FiscalScrollablePageProps) {
  return <Page footer={footer}>{children}</Page>;
}
