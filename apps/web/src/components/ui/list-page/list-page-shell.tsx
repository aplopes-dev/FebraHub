"use client";

import type { ReactNode } from "react";
import { Page } from "@/components/ui/page";
import type { BoxProps } from "@/ui";

export type ListPageShellProps = {
  children: ReactNode;
  sx?: BoxProps["sx"];
};

/**
 * Casca das listagens: `PageHeader` + `ListPagePanel` ocupando a altura do
 * `main`, com a **tabela** rolando por dentro.
 *
 * É um `Page` sem rolagem própria (`scroll={false}`) — numa listagem quem rola
 * é o corpo da tabela, e uma segunda barra por fora só atrapalharia. O `gap` de
 * 20px é a distância entre o cabeçalho da página e o box de conteúdo.
 *
 * Telas novas podem usar `<Page scroll={false}>` direto; este nome continua
 * porque é o que as ~33 listagens já existentes importam.
 */
export function ListPageShell({ children, sx }: ListPageShellProps) {
  return (
    <Page scroll={false} sx={sx}>
      {children}
    </Page>
  );
}
