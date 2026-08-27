"use client";

import type { ReactNode } from "react";
import { DualAppShell } from "@/shell/app-shell-dual";

/**
 * Casca do app: sidebar de duas colunas (rail + painel) com o conteúdo num
 * container flutuante — a forma do preset `v1`, o único do projeto.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return <DualAppShell>{children}</DualAppShell>;
}
