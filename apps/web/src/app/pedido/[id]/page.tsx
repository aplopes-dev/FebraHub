"use client";
import { use } from "react";
import { AcompanharPedido } from "@/components/loja/AcompanharPedido";
import "@/app/cardapio.css";

export default function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Envolve no escopo .cdp p/ herdar a fonte (Manrope) e os tokens do cardápio,
  // deixando a página /pedido consistente com o storefront.
  return (
    <div className="cdp">
      <AcompanharPedido id={id} />
    </div>
  );
}
