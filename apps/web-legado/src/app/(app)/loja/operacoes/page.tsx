"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { OperacoesLoja } from "@/components/loja/OperacoesLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <OperacoesLoja />
    </GuardaPermissao>
  );
}
