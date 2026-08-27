import type { ReactNode } from "react";
import { Box, ScrollArea } from "@/ui";
import { PAGE_PADDING } from "@/ui/templates/page-metrics";

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
 * O `<main>` do shell tem `overflow: hidden` e `p: PAGE_PADDING` (20px). Este
 * envelope cancela o padding com largura explícita + `alignSelf: flex-start`
 * (margem negativa nos dois lados amplia a largura no flex e corta o footer).
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
        alignSelf: "flex-start",
        width: (theme) => `calc(100% + ${theme.spacing(PAGE_PADDING * 2)})`,
        maxWidth: (theme) => `calc(100% + ${theme.spacing(PAGE_PADDING * 2)})`,
        ml: -PAGE_PADDING,
        mr: 0,
        mt: -PAGE_PADDING,
        mb: -PAGE_PADDING,
        boxSizing: "border-box",
      }}
    >
      <ScrollArea sx={{ minHeight: 0, flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            px: PAGE_PADDING,
            pt: PAGE_PADDING,
            pb: 2,
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          {children}
        </Box>
      </ScrollArea>
      {footer}
    </Box>
  );
}
