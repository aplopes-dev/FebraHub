/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LayoutDashboard, Menu, Moon, PanelLeft, Power, Sun, X, type LucideIcon } from "lucide-react";
import { SeletorCategoria } from "@/components/filtros/SeletorCategoria";
import { SeletorPeriodo } from "@/components/filtros/SeletorPeriodo";
import { CHAVE_SESSAO, ehAdmin, setoresDo } from "@/hooks/auth";
import { useMenu } from "@/hooks/menu";
import { useTema } from "@/hooks/tema";
import { sair } from "@/services/api/auth";
import { HUBS, PAGINA_INTEGRACOES, acharHub } from "@/lib/hubs";
import { ProvedorPeriodo } from "@/lib/periodo";
import { C, FUNDO_APP, SANS, alfa } from "@/lib/tema";
import type { Perfil } from "@/types/views";

/* ============ SHELL ============
   Sidebar + cabeçalho + provedor de período/categoria. O que no protótipo era
   o estado `tela` agora é a ROTA: cada hub tem URL própria, o menu navega com
   <Link> (sem recarregar) e o F5 cai no mesmo painel.

   No celular a sidebar vira gaveta (ver .fh-sidebar em globals.css): 250px
   fixos numa tela de 375px deixariam 125px para o painel. A gaveta é aberta
   pela barra superior, que só existe abaixo de 1100px. */

export function Shell({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const caminho = usePathname();
  const { alternar: alternarTema } = useTema();
  const { aberto: menuAberto, alternar: alternarMenu, fechar: fecharMenu,
          recolhido, alternarRecolhido } = useMenu();
  // União de setores: o setor do perfil + os de perfil_setores. Admin/geral
  // seguem vendo tudo, agora também se "geral" estiver entre os múltiplos setores.
  const setores = setoresDo(perfil);
  const admin = ehAdmin(perfil);
  const tela = (caminho ?? "/").split("/").filter(Boolean)[0] ?? "";

  const visiveis = admin ? HUBS : HUBS.filter((h) => setores.includes(h.key));
  const hub = acharHub(tela);

  // Navegar fecha a gaveta. Sem isto, tocar num hub troca o painel atrás de um
  // menu que continua aberto por cima dele.
  useEffect(() => { fecharMenu(); }, [caminho, fecharMenu]);

  const deslogar = async () => {
    await sair();
    qc.setQueryData(CHAVE_SESSAO, null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === "view" });
    router.replace("/login");
  };

  const Item = ({ chave, label, Icone }: { chave: string; label: string; Icone: LucideIcon }) => {
    const ativo = tela === chave;
    return (
      <Link href={`/${chave}`} aria-current={ativo ? "page" : undefined}
        className="fh-item-menu"
        // Com o menu recolhido o rótulo some, então o nome vai para o title —
        // senão sobra um ícone sem nada que diga o que ele abre.
        title={recolhido ? label : undefined}
        style={{
        width: "100%", display: "flex", alignItems: "center", gap: 11,
        // 11px de padding vertical dá 40px de alvo com o ícone de 16 — o piso
        // confortável para o dedo, sem mudar o desenho no desktop.
        padding: "11px 12px", borderRadius: 9, fontSize: 13.5, fontWeight: 600,
        background: ativo ? alfa("gold", 0.12) : "transparent",
        color: ativo ? C.gold : C.muted,
        border: "none", cursor: "pointer", fontFamily: SANS, textAlign: "left",
        textDecoration: "none",
      }}>
        <Icone size={16} />
        <span className="fh-so-expandido">{label}</span>
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

  const botaoIcone = {
    background: "none", border: "none", cursor: "pointer", color: C.faint,
    display: "flex", padding: 2,
  } as const;

  return (
    <ProvedorPeriodo>
      <div style={{
        minHeight: "100dvh", display: "flex", color: C.text, fontFamily: SANS,
        background: FUNDO_APP,
      }}>
        {/* Fecha a gaveta ao tocar fora. É <button> e não <div> para o leitor
            de tela anunciar a ação e o teclado alcançá-la. */}
        <button
          className="fh-backdrop"
          onClick={fecharMenu}
          tabIndex={menuAberto ? 0 : -1}
          aria-label="Fechar menu"
        />

        <aside
          className="fh-sidebar rolagem"
          // Enquanto fechada no celular, a gaveta sai da ordem de leitura: um
          // menu invisível continuaria tabulável e o foco sumiria da tela.
          aria-hidden={menuAberto ? undefined : "true"}
          style={{
            borderRight: `1px solid ${alfa("sup", 0.07)}`,
            background: C.panel, backdropFilter: "blur(8px)",
          }}
        >
          <div className="fh-topo-menu" style={{ padding: "22px 20px 18px", display: "flex", alignItems: "center", gap: 11 }}>
            <img src="/logo-febracis.webp" alt="" width={32} height={32} />
            <div className="fh-so-expandido" style={{ lineHeight: 1.15, flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: ".2px" }}>FebraHub</div>
              <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>
                Central de Inteligência
              </div>
            </div>
            {/* Recolher/expandir — só no desktop, onde a coluna é fixa. No
                celular quem abre e fecha é o hambúrguer da barra superior. */}
            <button
              onClick={alternarRecolhido}
              className="fh-so-desktop fh-toque"
              aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!recolhido}
              title={recolhido ? "Expandir menu" : "Recolher menu"}
              style={{ ...botaoIcone, color: C.muted }}
            >
              <PanelLeft size={16} style={{ transform: recolhido ? "rotate(180deg)" : "none", transition: "transform .18s ease" }} />
            </button>
            {/* Fechar dentro da gaveta: no celular o backdrop pode ficar
                escondido atrás do teclado ou de uma barra do navegador. */}
            <button
              onClick={fecharMenu}
              className="fh-so-gaveta fh-toque"
              aria-label="Fechar menu"
              style={{ ...botaoIcone, color: C.muted }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: "6px 12px", flex: 1, overflowY: "auto" }}>
            {admin && (
              <>
                <div className="fh-grupo-menu" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: C.dim, textTransform: "uppercase", padding: "12px 12px 8px" }}>
                  Painéis
                </div>
                <Item chave="executivo" label="Hub Executivo" Icone={LayoutDashboard} />
              </>
            )}

            <div className="fh-grupo-menu" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: C.dim, textTransform: "uppercase", padding: "20px 12px 8px" }}>
              {admin ? "Setores" : "Seu hub"}
            </div>
            {visiveis.map((h) => <Item key={h.key} chave={h.key} label={h.nome} Icone={h.Icone} />)}

            {/* Só para admin: reconectar fonte é operação de quem administra o
                sistema, e a API exige o setor 'geral' de qualquer forma. */}
            {admin && (
              <>
                <div className="fh-grupo-menu" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: C.dim, textTransform: "uppercase", padding: "20px 12px 8px" }}>
                  Sistema
                </div>
                <Item chave={PAGINA_INTEGRACOES.key} label={PAGINA_INTEGRACOES.nome} Icone={PAGINA_INTEGRACOES.Icone} />
              </>
            )}
          </div>

          <div style={{ padding: 12, borderTop: `1px solid ${alfa("sup", 0.07)}` }}>
            <div className="fh-rodape-perfil" style={{ display: "flex", alignItems: "center", gap: 11, padding: 8, borderRadius: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(150deg, var(--avatar-top), var(--avatar-base))",
                border: `1px solid ${alfa("gold", 0.4)}`, color: C.gold,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 12.5,
              }}>
                {iniciais}
              </div>
              <div className="fh-so-expandido" style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
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
                <button onClick={alternarTema} title="Alternar tema claro/escuro" aria-label="Alternar tema claro/escuro" className="fh-toque" style={botaoIcone}>
                  <Sun size={15} className="so-claro" />
                  <Moon size={15} className="so-escuro" />
                </button>
                <button onClick={deslogar} title="Sair" aria-label="Sair" className="fh-toque" style={botaoIcone}>
                  <Power size={15} />
                </button>
              </span>
            </div>
          </div>
        </aside>

        <main className="rolagem" style={{ flex: 1, minWidth: 0, height: "100dvh", overflowY: "auto" }}>
          {/* Barra superior: só no celular (CSS). Carrega o hambúrguer e o nome
              do hub, para saber onde se está sem abrir o menu. */}
          <div className="fh-topbar">
            <button
              onClick={alternarMenu}
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
              className="fh-toque"
              style={{ ...botaoIcone, color: C.text, padding: 4 }}
            >
              <Menu size={20} />
            </button>
            <img src="/logo-febracis.webp" alt="" width={22} height={22} />
            <span style={{
              fontWeight: 800, fontSize: 13.5, letterSpacing: ".2px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {tela === "executivo" ? "Hub Executivo" : hub?.nome ?? "FebraHub"}
            </span>
          </div>

          <div className="subir" style={{
            padding: "var(--pad-pagina) var(--pad-pagina) var(--pad-pagina-baixo)",
            maxWidth: 1320, margin: "0 auto",
          }}>

            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              gap: 14, flexWrap: "wrap", marginBottom: 20,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "var(--data-topo)", fontWeight: 700, letterSpacing: ".6px", color: C.gold, textTransform: "uppercase", marginBottom: 6 }}>
                  {hoje}
                </div>
                <h1 style={{ fontSize: "var(--h1)", fontWeight: 800, letterSpacing: "-.6px", fontFamily: SANS, lineHeight: 1.15 }}>
                  {tela === "executivo"
                    ? `${saudacao}, ${primeiroNome}.`
                    : hub?.nome}
                </h1>
                {tela !== "executivo" && (
                  <div style={{ fontSize: 13, color: C.faint, marginTop: 5 }}>{hub?.desc}</div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* O Executivo tem filtro próprio, refletido na URL (mês +
                    comparação); o seletor global não age sobre ele e só
                    confundiria — dois controles de período na mesma tela. */}
                {tela !== "executivo" && <SeletorPeriodo />}
                {tela === "comercial" && <SeletorCategoria />}
                {/* O sino é decorativo (sem notificação ainda) e some no
                    celular: ocupar 40px de uma barra apertada por um enfeite
                    é o tipo de coisa que empurra o filtro para outra linha. */}
                <div className="fh-sem-celular" style={{
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
