"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { VendasLoja } from "@/components/loja/VendasLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <VendasLoja />
    </GuardaPermissao>
  );
}
