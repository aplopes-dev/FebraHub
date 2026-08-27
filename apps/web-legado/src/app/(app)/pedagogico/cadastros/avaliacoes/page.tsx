"use client";

import { GuardaSetor } from "@/components/auth/GuardaSetor";
import { CrudAvaliacoes } from "@/components/cadastros/pedagogico/CrudAvaliacoes";

export default function PaginaAvaliacoes() {
  return (
    <GuardaSetor setor="pedagogico">
      <CrudAvaliacoes />
    </GuardaSetor>
  );
}
