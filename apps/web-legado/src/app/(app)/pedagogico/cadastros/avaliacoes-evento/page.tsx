"use client";

import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudAvaliacoesEvento } from "@/components/cadastros/pedagogico/CrudAvaliacoesEvento";

export default function PaginaAvaliacoesEvento() {
  return (
    <GuardaSetor setor="pedagogico">
      <CrudAvaliacoesEvento />
    </GuardaSetor>
  );
}
