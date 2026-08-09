"use client";

import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudMetasCurso } from "@/components/cadastros/loja/CrudMetasCurso";

export default function PaginaMetasCurso() {
  return (
    <GuardaSetor setor="loja">
      <CrudMetasCurso />
    </GuardaSetor>
  );
}
