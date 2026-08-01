/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import { CHAVE_SESSAO } from "@/hooks/auth";
import { entrar } from "@/services/api/auth";
import { C, FUNDO_APP, GROTESK, SANS, SOBRE_OURO, alfa } from "@/lib/tema";

/* ============ LOGIN ============ */

export function Login() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);

  const submeter = async () => {
    setErro(null); setIndo(true);
    try {
      // A API devolve a sessão e planta o cookie httpOnly; semear o cache
      // evita um GET /auth/eu redundante logo na entrada.
      const sessao = await entrar(email.trim(), senha);
      qc.setQueryData(CHAVE_SESSAO, sessao);
      router.replace("/");
    }
    catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível entrar."); }
    finally { setIndo(false); }
  };

  const campo: CSSProperties = {
    width: "100%", padding: "11px 13px 11px 38px", fontSize: 13.5,
    borderRadius: 10, border: `1px solid ${C.cardLine}`,
    background: alfa("sup", 0.04), color: C.text,
    outline: "none", fontFamily: SANS, fontWeight: 500,
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      background: FUNDO_APP,
      fontFamily: SANS, color: C.text,
    }}>
      <div style={{ width: "100%", maxWidth: 380, animation: "subir .5s ease" }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 }}>
          <img
            src="/logo-febracis.webp"
            alt="Febracis"
            width={62}
            height={62}
            style={{ marginBottom: 16, filter: `drop-shadow(0 6px 22px ${alfa("gold", 0.19)})` }}
          />
          <div style={{ fontFamily: GROTESK, fontSize: 27, fontWeight: 700, letterSpacing: "-.4px" }}>
            FebraHub
          </div>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", marginTop: 5 }}>
            Central de Inteligência
          </div>
        </div>

        <div style={{
          background: C.panel, border: `1px solid ${C.cardLine}`,
          borderRadius: 18, padding: 26, backdropFilter: "blur(8px)",
        }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
            E-mail corporativo
          </label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Mail size={15} style={{ position: "absolute", left: 13, top: 13, color: C.faint }} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submeter(); }}
              placeholder="voce@febracis.com.br" style={campo} />
          </div>

          <label style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
            Senha
          </label>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <Lock size={15} style={{ position: "absolute", left: 13, top: 13, color: C.faint }} />
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submeter(); }}
              placeholder="••••••••" style={campo} />
          </div>

          {erro && (
            <div style={{ fontSize: 12.5, color: C.down, marginBottom: 16, display: "flex", gap: 7, fontWeight: 600 }}>
              <ShieldAlert size={14} style={{ marginTop: 1, flexShrink: 0 }} /> {erro}
            </div>
          )}

          <button onClick={submeter} disabled={indo || !email || !senha}
            style={{
              width: "100%", padding: "12px", fontSize: 13.5, fontWeight: 800, borderRadius: 10,
              background: `linear-gradient(150deg, ${C.goldTop}, ${C.goldBase})`, color: SOBRE_OURO,
              border: "none", cursor: indo ? "default" : "pointer",
              opacity: indo || !email || !senha ? 0.45 : 1, fontFamily: SANS,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {indo ? <Loader2 size={15} className="girar" /> : <>Entrar <ArrowRight size={15} /></>}
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 18, textAlign: "center" }}>
          Cada setor acessa apenas os próprios indicadores.
        </div>
      </div>
    </div>
  );
}
