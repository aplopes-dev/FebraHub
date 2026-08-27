"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { DashboardLoja } from "@/components/loja/DashboardLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <DashboardLoja />
    </GuardaPermissao>
  );
}
