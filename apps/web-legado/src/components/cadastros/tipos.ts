import type { ReactNode } from "react";

export type CampoTipo = "text" | "number" | "date" | "month" | "textarea" | "select";

export interface CampoCrud {
  name: string;
  label: string;
  tipo: CampoTipo;
  obrigatorio?: boolean;
  placeholder?: string;
  opcoes?: { valor: string; label: string }[];
  /** Largura no grid do formulário (1 ou 2 colunas). */
  span?: 1 | 2;
  min?: number;
  max?: number;
  step?: number;
}

export interface ColunaCrud<T> {
  chave: keyof T | string;
  label: string;
  alinhar?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
  /** Esconde em telas estreitas. */
  sumirMobile?: boolean;
}

export interface ListaCrud<T> {
  itens: T[];
  total: number;
  pagina: number;
  por_pagina: number;
}
