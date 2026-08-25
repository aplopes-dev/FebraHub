"use client";
import { RetiradaLoja } from "@/components/loja/RetiradaLoja";

/** Reaproveita a tela de retirada por QR (scanner de câmera + fallback manual).
 *  O wrapper .pm-scanwrap esconde o hero desktop e ajusta o padding para o
 *  layout móvel. A verificação/resgate e o leitor são exatamente os mesmos. */
export default function RetiradaMovel() {
  return (
    <div className="pm-scanwrap">
      <RetiradaLoja />
    </div>
  );
}
