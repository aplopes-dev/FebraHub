"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { CHAVE_SESSAO } from "@/hooks/auth";
import { sair } from "@/services/api/auth";
import { C, SANS, alfa } from "@/lib/tema";

/** O usuário existe na autenticação mas ninguém definiu setor/papel. Não é
 *  erro de código nem falta de permissão: é cadastro incompleto, e a tela
 *  diz exatamente isso em vez de mostrar um hub vazio. */
export function SemPerfil() {
  const router = useRouter();
  const qc = useQueryClient();

  const deslogar = async () => {
    await sair();
    qc.setQueryData(CHAVE_SESSAO, null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === "view" });
    router.replace("/login");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 13, background: C.void, color: C.text,
      fontFamily: SANS, padding: 24, textAlign: "center",
    }}>
      <ShieldAlert size={22} style={{ color: C.down }} />
      <div style={{ fontSize: 14, fontWeight: 700 }}>Seu usuário existe, mas não tem perfil configurado.</div>
      <div style={{ fontSize: 12.5, color: C.faint, maxWidth: 340 }}>
        Peça a um administrador para definir seu setor e papel.
      </div>
      <button onClick={deslogar} style={{
        fontSize: 12.5, fontWeight: 700, padding: "9px 18px", borderRadius: 9,
        background: alfa("sup", 0.05), border: `1px solid ${C.cardLine}`,
        color: C.muted, cursor: "pointer", fontFamily: SANS,
      }}>
        Sair
      </button>
    </div>
  );
}
