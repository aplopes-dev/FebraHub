"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { EstoqueGeral } from "@/components/loja/EstoqueGeral";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.produtos.ver", "compras.operar"]}>
      <EstoqueGeral />
    </GuardaPermissao>
  );
}
