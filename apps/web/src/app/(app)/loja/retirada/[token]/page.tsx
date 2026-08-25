"use client";
import { use } from "react";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { RetiradaLoja } from "@/components/loja/RetiradaLoja";

/** Deep-link do QR: o vendedor escaneia com a câmera do aparelho e cai direto
 *  aqui (rota autenticada). Passa o token para a tela já verificar o pedido. */
export default function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <GuardaPermissao permissoes={["loja.pedidos.operar"]}>
      <RetiradaLoja tokenInicial={decodeURIComponent(token)} />
    </GuardaPermissao>
  );
}
