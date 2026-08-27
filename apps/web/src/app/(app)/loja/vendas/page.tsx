"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { CentralVendas } from "@/components/loja/CentralVendas";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <CentralVendas />
    </GuardaPermissao>
  );
}
