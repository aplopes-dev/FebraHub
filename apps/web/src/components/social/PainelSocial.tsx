"use client";

/* Conexão das redes (submenu Marketing → Configurar conexão).

   Duas integrações, lado a lado:
     · Zernio (API key) — publica/agenda pelas contas autorizadas;
     · Instagram (login direto, aiograpi-rest) — conta oficial com API privada
       (DMs, mídia, stories, insights).
   As duas usam as mesmas permissões de redes sociais (a conta é uma só). */

import { AbaConfiguracao } from "./AbaConfiguracao";
import { AbaInstagram } from "./AbaInstagram";

export function PainelSocial() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AbaConfiguracao />
      <AbaInstagram />
    </div>
  );
}
