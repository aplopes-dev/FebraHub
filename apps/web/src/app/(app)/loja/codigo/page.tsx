"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { AtenderCodigo } from "@/components/loja/AtenderCodigo";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.operar"]}>
      <AtenderCodigo />
    </GuardaPermissao>
  );
}
