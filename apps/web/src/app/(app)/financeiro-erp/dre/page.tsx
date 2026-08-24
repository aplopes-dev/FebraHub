"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { DreFinanceiro } from "@/components/financeiro/DreFinanceiro";

export default function Pagina() {
  return <GuardaPermissao permissoes={["financeiro.erp.ver"]}><DreFinanceiro /></GuardaPermissao>;
}
