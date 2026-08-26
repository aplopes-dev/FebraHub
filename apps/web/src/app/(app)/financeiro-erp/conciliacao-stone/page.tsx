"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { ConciliacaoStone } from "@/components/financeiro/ConciliacaoStone";

export default function Pagina() {
  return <GuardaPermissao permissoes={["financeiro.erp.ver"]}><ConciliacaoStone /></GuardaPermissao>;
}
