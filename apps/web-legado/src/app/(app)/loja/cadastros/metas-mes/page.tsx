"use client";

import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudMetasMes } from "@/components/cadastros/loja/CrudMetasMes";

export default function PaginaMetasMes() {
  return (
    <GuardaSetor setor="loja">
      <CrudMetasMes />
    </GuardaSetor>
  );
}
