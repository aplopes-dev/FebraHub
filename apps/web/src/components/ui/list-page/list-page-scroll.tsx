"use client";

import type { ReactNode } from "react";
import { Box, ScrollArea } from "@/ui";
import { PAGE_PADDING } from "@/ui/templates/page-metrics";

export type ListPageScrollProps = {
  children: ReactNode;
};

/**
 * Scroll da página com a barra encostada na borda direita da coluna de
 * conteúdo — como a scrollbar nativa do navegador.
 *
 * O `<main>` tem padding à direita (`pagePaddingSx`). Só cancelamos esse
 * recuo à direita; o conteúdo interno recupera o `pr` para não colar na barra.
 */
export function ListPageScroll({ children }: ListPageScrollProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        mr: { xs: -2, sm: -PAGE_PADDING },
      }}
    >
      <ScrollArea
        scrollbarVisibility="always"
        sx={{ flex: 1, minHeight: 0, minWidth: 0 }}
      >
        <Box
          sx={{
            pr: { xs: 2, sm: PAGE_PADDING },
            pb: 2,
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </ScrollArea>
    </Box>
  );
}
