"use client";
import { use } from "react";
import { PainelTv } from "@/components/loja/PainelTv";

export default function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <PainelTv slug={slug} />;
}
