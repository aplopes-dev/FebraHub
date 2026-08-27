"use client";
import { use } from "react";
import { AcompanharPedido } from "@/components/loja/AcompanharPedido";

export default function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AcompanharPedido id={id} />;
}
