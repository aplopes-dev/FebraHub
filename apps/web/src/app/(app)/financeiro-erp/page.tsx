"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { CentralFinanceiro } from "@/components/financeiro/CentralFinanceiro";

export default function Pagina() {
  return <GuardaPermissao permissoes={["financeiro.erp.ver"]}><CentralFinanceiro /></GuardaPermissao>;
}
