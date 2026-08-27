"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { InventarioLoja } from "@/components/loja/InventarioLoja";
import { pode, usePerfil, useSessao } from "@/hooks/auth";

export default function Pagina() {
  const perfil = usePerfil(useSessao());
  const podeGerir = pode(perfil.data, "loja.produtos.gerenciar");
  return (
    <GuardaPermissao permissoes={["loja.produtos.ver", "compras.operar"]}>
      <InventarioLoja podeGerir={podeGerir} />
    </GuardaPermissao>
  );
}
