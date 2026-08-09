"use client";

import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudFechamento } from "@/components/cadastros/loja/CrudFechamento";

export default function PaginaFechamento() {
  return (
    <GuardaSetor setor="loja">
      <CrudFechamento />
    </GuardaSetor>
  );
}
