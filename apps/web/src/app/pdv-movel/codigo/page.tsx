"use client";
import { AtenderCodigo } from "@/components/loja/AtenderCodigo";

/** Retirada / atendimento pelo código de 3 dígitos do cliente, dentro do PDV
 *  móvel. Reaproveita o mesmo componente do balcão; o wrapper .pm-scanwrap
 *  esconde o hero desktop e ajusta o padding para o layout do app. */
export default function CodigoMovel() {
  return (
    <div className="pm-scanwrap">
      <AtenderCodigo />
    </div>
  );
}
