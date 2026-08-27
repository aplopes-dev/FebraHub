"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { FilaLoja } from "@/components/loja/FilaLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <FilaLoja />
    </GuardaPermissao>
  );
}
