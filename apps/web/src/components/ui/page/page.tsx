"use client";

import type { ReactNode } from "react";
import { Box, ScrollArea, type BoxProps } from "@/ui";
import { PAGE_PADDING, PAGE_PADDING_MOBILE, pageBleedSx } from "@/ui/templates/page-metrics";

export type PageProps = {
  children: ReactNode;
  /**
   * A **página inteira** rola (padrão).
   *
   * Passe `false` quando quem rola é um container interno — tabela com
   * `pageScroll`, quadro do funil, lista da sala. Nesse modo a página ocupa a
   * altura do `main` e o filho é que precisa ter `minHeight: 0` e rolagem
   * própria; duas barras de rolagem aninhadas é o defeito que este modo evita.
   */
  scroll?: boolean;
  /**
   * Rodapé fixo, **fora** da área rolável — barra de ações de formulário, por
   * exemplo. Ele fica colado no fim da página enquanto o conteúdo rola.
   */
  footer?: ReactNode;
  /** Espaço entre os filhos diretos. Padrão: 20px, a medida da página. */
  gap?: number;
  /** Estilos extras no container do conteúdo. */
  sx?: BoxProps["sx"];
};

/**
 * A casca de uma página do backoffice.
 *
 * **Por que ela existe.** O `<main>` do shell é `overflow: hidden` (ver
 * `DualDashboardLayout`): conteúdo mais alto que a janela simplesmente some,
 * sem barra de rolagem. Até aqui cada tela resolvia isso na mão, repetindo um
 * envelope com margem negativa + `ScrollArea` + padding de volta — e com
 * medidas que divergiam entre si (24px onde o `main` usa 20px).
 *
 * `Page` centraliza esse envelope: **por padrão a página rola**. Quem tem
 * rolagem interna passa `scroll={false}` e assume o controle da altura.
 *
 * ```tsx
 * <Page>                          // página rola (formulário, ficha, painel)
 * <Page scroll={false}>           // a tabela/quadro dentro é que rola
 * <Page footer={<FormFooter />}>  // barra de ações fixa embaixo
 * ```
 */
export function Page({
  children,
  scroll = true,
  footer,
  gap = PAGE_PADDING,
  sx,
}: PageProps) {
  if (!scroll) {
    return (
      <Box
        sx={[
          {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden",
            gap,
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {children}
        {footer}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        // Sem isto o box cresce além do `main` no flex e come o rodapé.
        alignSelf: "flex-start",
        boxSizing: "border-box",
        ...pageBleedSx,
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <Box
          sx={[
            {
              display: "flex",
              flexDirection: "column",
              gap,
              minWidth: 0,
              maxWidth: "100%",
              px: { xs: PAGE_PADDING_MOBILE, sm: PAGE_PADDING },
              pt: { xs: PAGE_PADDING_MOBILE, sm: PAGE_PADDING },
              // Numa página que rola, nenhum bloco encolhe: o que não cabe
              // desce. Sem isto o flex espreme a faixa de cards e o bloco
              // seguinte sobe por cima dela.
              "& > *": { flexShrink: 0 },
              // Respiro no fim da rolagem: encostar o último card na borda dá
              // a impressão de que a página foi cortada.
              pb: 4,
            },
            ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ]}
        >
          {children}
        </Box>
      </ScrollArea>
      {footer}
    </Box>
  );
}
