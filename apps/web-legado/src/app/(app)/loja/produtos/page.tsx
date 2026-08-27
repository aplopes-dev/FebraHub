"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { CatalogoLoja } from "@/components/loja/CatalogoLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.produtos.ver"]}>
      <CatalogoLoja />
    </GuardaPermissao>
  );
}
