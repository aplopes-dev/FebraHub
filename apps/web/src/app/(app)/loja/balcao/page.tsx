"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { BalcaoPdv } from "@/components/loja/BalcaoPdv";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.operar"]}>
      <BalcaoPdv />
    </GuardaPermissao>
  );
}
