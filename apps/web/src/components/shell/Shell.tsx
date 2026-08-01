/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LayoutDashboard, Moon, Power, Sun, type LucideIcon } from "lucide-react";
import { SeletorCategoria } from "@/components/filtros/SeletorCategoria";
import { SeletorPeriodo } from "@/components/filtros/SeletorPeriodo";
import { CHAVE_SESSAO, ehAdmin, setoresDo } from "@/hooks/auth";
import { useTema } from "@/hooks/tema";
import { sair } from "@/services/api/auth";
import { HUBS, PAGINA_INTEGRACOES, acharHub } from "@/lib/hubs";
import { ProvedorPeriodo } from "@/lib/periodo";
import { C, FUNDO_APP, SANS, alfa } from "@/lib/tema";
import type { Perfil } from "@/types/views";

/* ============ SHELL ============
   Sidebar + cabeçalho + provedor de período/categoria. O que no protótipo era
   o estado `tela` agora é a ROTA: cada hub tem URL própria, o menu navega com
   <Link> (sem recarregar) e o F5 cai no mesmo painel. */

export function Shell({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const caminho = usePathname();
  const { alternar: alternarTema } = useTema();
  // União de setores: o setor do perfil + os de perfil_setores. Admin/geral
  // seguem vendo tudo, agora também se "geral" estiver entre os múltiplos setores.
  const setores = setoresDo(perfil);
  const admin = ehAdmin(perfil);
  const tela = (caminho ?? "/").split("/").filter(Boolean)[0] ?? "";

  const visiveis = admin ? HUBS : HUBS.filter((h) => setores.includes(h.key));
  const hub = acharHub(tela);

  const deslogar = async () => {
    await sair();
    qc.setQueryData(CHAVE_SESSAO, null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === "view" });
    router.replace("/login");
  };

  const Item = ({ chave, label, Icone }: { chave: string; label: string; Icone: LucideIcon }) => {
    const ativo = tela === chave;
    return (
      <Link href={`/${chave}`} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 11,
        padding: "9px 12px", borderRadius: 9, fontSize: 13.5, fontWeight: 600,
        background: ativo ? alfa("gold", 0.12) : "transparent",
        color: ativo ? C.gold : C.muted,
        border: "none", cursor: "pointer", fontFamily: SANS, textAlign: "left",
        textDecoration: "none",
      }}>
        <Icone size={16} /> {label}
      </Link>
    );
  };

  const iniciais = (perfil.nome ?? "")
    .split(/[\s.]+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join("") || "??";

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "short", year: "numeric",
  });

  const primeiroNome = (perfil.nome ?? "").split(/[\s.]+/)[0];
  const saudacao = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <ProvedorPeriodo>
      <div style={{
        minHeight: "100vh", display: "flex", color: C.text, fontFamily: SANS,
        background: FUNDO_APP,
      }}>
        <aside className="rolagem" style={{
          width: 250, flex: "none", borderRight: `1px solid ${alfa("sup", 0.07)}`,
          background: C.panel, backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
        }}>
          <div style={{ padding: "22px 20px 18px", display: "flex", alignItems: "center", gap: 11 }}>
            <img src="/logo-febracis.webp" alt="" width={32} height={32} />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: ".2px" }}>FebraHub</div>
              <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>
                Central de Inteligência
              </div>
            </div>
          </div>

          <div style={{ padding: "6px 12px", flex: 1, overflowY: "auto" }}>
            {admin && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: C.dim, textTransform: "uppercase", padding: "12px 12px 8px" }}>
                  Painéis
                </div>
                <Item chave="executivo" label="Hub Executivo" Icone={LayoutDashboard} />
              </>
            )}

            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: C.dim, textTransform: "uppercase", padding: "20px 12px 8px" }}>
              {admin ? "Setores" : "Seu hub"}
            </div>
            {visiveis.map((h) => <Item key={h.key} chave={h.key} label={h.nome} Icone={h.Icone} />)}

            {/* Só para admin: reconectar fonte é operação de quem administra o
                sistema, e a API exige o setor 'geral' de qualquer forma. */}
            {admin && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: C.dim, textTransform: "uppercase", padding: "20px 12px 8px" }}>
                  Sistema
                </div>
                <Item chave={PAGINA_INTEGRACOES.key} label={PAGINA_INTEGRACOES.nome} Icone={PAGINA_INTEGRACOES.Icone} />
              </>
            )}
          </div>

          <div style={{ padding: 12, borderTop: `1px solid ${alfa("sup", 0.07)}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: 8, borderRadius: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(150deg, var(--avatar-top), var(--avatar-base))",
                border: `1px solid ${alfa("gold", 0.4)}`, color: C.gold,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 12.5,
              }}>
                {iniciais}
              </div>
              <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {perfil.nome}
                </div>
                <div style={{ fontSize: 11, color: C.faint, textTransform: "capitalize" }}>
                  {admin ? "Diretora Executiva" : perfil.setor}
                </div>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                {/* Claro/escuro. Os DOIS ícones vão pro DOM e o CSS mostra um
                    (.so-claro / .so-escuro): se o ícone dependesse de estado do
                    React, ele piscaria entre o HTML do servidor — que não tem
                    como saber o tema — e a hidratação. */}
                <button onClick={alternarTema} title="Alternar tema claro/escuro" aria-label="Alternar tema claro/escuro" style={{
                  background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex", padding: 2,
                }}>
                  <Sun size={15} className="so-claro" />
                  <Moon size={15} className="so-escuro" />
                </button>
                <button onClick={deslogar} title="Sair" aria-label="Sair" style={{
                  background: "none", border: "none", cursor: "pointer", color: C.faint, display: "flex", padding: 2,
                }}>
                  <Power size={15} />
                </button>
              </span>
            </div>
          </div>
        </aside>

        <main className="rolagem" style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto" }}>
          <div className="subir" style={{ padding: "26px 34px 60px", maxWidth: 1320, margin: "0 auto" }}>

            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              gap: 20, flexWrap: "wrap", marginBottom: 24,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".6px", color: C.gold, textTransform: "uppercase", marginBottom: 6 }}>
                  {hoje}
                </div>
                <h1 style={{ fontSize: 29, fontWeight: 800, letterSpacing: "-.6px", fontFamily: SANS }}>
                  {tela === "executivo"
                    ? `${saudacao}, ${primeiroNome}.`
                    : hub?.nome}
                </h1>
                {tela !== "executivo" && (
                  <div style={{ fontSize: 13, color: C.faint, marginTop: 5 }}>{hub?.desc}</div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <SeletorPeriodo />
                {tela === "comercial" && <SeletorCategoria />}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.cardLine}`,
                  background: alfa("sup", 0.04), display: "flex", alignItems: "center",
                  justifyContent: "center", color: "var(--icone)", flexShrink: 0,
                }}>
                  <Bell size={16} />
                </div>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </ProvedorPeriodo>
  );
}
