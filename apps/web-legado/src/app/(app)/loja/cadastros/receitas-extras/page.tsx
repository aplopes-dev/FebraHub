"use client";

import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudReceitasExtras } from "@/components/cadastros/loja/CrudReceitasExtras";

export default function PaginaReceitasExtras() {
  return (
    <GuardaSetor setor="loja">
      <CrudReceitasExtras />
    </GuardaSetor>
  );
}
