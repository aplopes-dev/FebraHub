"use client";
import { use } from "react";
import { CardapioPublico } from "@/components/loja/CardapioPublico";

export default function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <CardapioPublico slug={slug} />;
}
