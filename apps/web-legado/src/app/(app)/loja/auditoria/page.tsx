"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { AuditoriaLoja } from "@/components/loja/AuditoriaLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.gerenciar"]}>
      <AuditoriaLoja />
    </GuardaPermissao>
  );
}
