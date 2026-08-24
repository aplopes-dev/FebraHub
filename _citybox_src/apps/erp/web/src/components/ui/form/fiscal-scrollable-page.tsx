import type { ReactNode } from "react";
import { Box, ScrollArea } from "@citybox/mui";

export type FiscalScrollablePageProps = {
  children: ReactNode;
  /**
   * Rodapé fixo fora da área de rolagem (ex.: barra de ação sticky). Opcional
   * — a maioria das telas do Menu Fiscal já mantém o botão de ação dentro do
   * próprio conteúdo rolável (não precisa desse slot).
   */
  footer?: ReactNode;
};

/**
 * Envelope full-bleed + scroll para o Menu Fiscal (spec erp/022, P2).
 *
 * O `<main>` do shell do lojista tem `overflow-y: hidden` (decisão de layout
 * fora de escopo tocar) — sem esse envelope, qualquer tela fiscal mais alta
 * que a viewport fica com conteúdo/botões inalcançáveis (mouse e teclado). É
 * o mesmo padrão já usado e comprovado em `/catalogo/produtos/novo`
 * (`features/products/components/product-form-view.tsx`): um `Box` `m: -3`
 * cancela o `p: 3` do `<main>` e vira full-bleed; o `ScrollArea` de
 * `@citybox/mui` envolve só o conteúdo rolável — `footer`, se houver, fica
 * fora dele como irmão fixo.
 *
 * Não substitui `PageHeader`/`EntityFormHeader` — só resolve o scroll ao
 * redor do que a página já renderiza.
 */
export function FiscalScrollablePage({
  children,
  footer,
}: FiscalScrollablePageProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Box sx={{ px: 3, pt: 3, pb: 2, minWidth: 0, maxWidth: "100%" }}>
          {children}
        </Box>
      </ScrollArea>
      {footer}
    </Box>
  );
}
