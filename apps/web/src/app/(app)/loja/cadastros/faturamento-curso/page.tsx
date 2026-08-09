"use client";

import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudFaturamentoCurso } from "@/components/cadastros/loja/CrudFaturamentoCurso";

export default function PaginaFaturamentoCurso() {
  return (
    <GuardaSetor setor="loja">
      <CrudFaturamentoCurso />
    </GuardaSetor>
  );
}
