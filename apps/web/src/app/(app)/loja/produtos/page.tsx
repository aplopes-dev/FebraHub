"use client";
import { Suspense } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { CatalogoLoja } from "@/components/loja/CatalogoLoja";

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.produtos.ver"]}>
      {/* CatalogoLoja usa useSearchParams (deep-link ?editar=<id> vindo do PDV) */}
      <Suspense fallback={null}>
        <CatalogoLoja />
      </Suspense>
    </GuardaPermissao>
  );
}
