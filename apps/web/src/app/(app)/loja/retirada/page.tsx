"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { RetiradaLoja } from "@/components/loja/RetiradaLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.operar"]}>
      <RetiradaLoja />
    </GuardaPermissao>
  );
}
