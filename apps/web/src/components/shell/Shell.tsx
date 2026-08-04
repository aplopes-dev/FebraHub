/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Moon, PanelLeft, Power, Sun, X } from "lucide-react";
import { SeletorCategoria } from "@/components/filtros/SeletorCategoria";
import { SeletorPeriodo } from "@/components/filtros/SeletorPeriodo";
import { PerguntaRapida } from "@/components/brain/PerguntaRapida";
import { SinoNotificacoes } from "@/components/notificacoes/SinoNotificacoes";
import { TeamsWidget } from "@/components/teams-widget/teams-widget";
import { CHAVE_SESSAO, ehAdmin, pode, setoresVisiveis } from "@/hooks/auth";
import { useMenu } from "@/hooks/menu";
import { useSessaoViva } from "@/hooks/sessao-viva";
import { useTema } from "@/hooks/tema";
import { sair } from "@/services/api/auth";
import { GRUPOS_MENU, idItemAtivo, itemPorId, tituloDaRota, type ItemMenu } from "@/lib/menu";
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
  // Renova o acesso antes de expirar (só monta aqui: quem chegou ao Shell
  // está logado — na tela de login não há o que renovar).
  useSessaoViva();
  // Setores que a pessoa alcança: os do cadastro (perfil + perfil_setores)
  // MAIS os que o perfil de acesso concede via `setor.<hub>.ver`. Admin/geral
  // seguem vendo tudo.
  const setores = setoresVisiveis(perfil);
  const admin = ehAdmin(perfil);
  // O menu agora pergunta por PERMISSÃO, não por "é admin?": quem abre o
  // Territorial ou a tela de Perfis é decisão do perfil de acesso, editável
  // em /configuracoes/perfis sem tocar em código.
  const ctxMenu = { admin, setores, pode: (...p: string[]) => pode(perfil, ...p) };

  // O item ativo vem da config central (lib/menu): casa por segmento inteiro
  // e a rota mais específica vence. Era aqui que "Fontes de dados" acendia em
  // toda rota de /integracoes — a comparação olhava só o 1º segmento.
  const grupos = GRUPOS_MENU
    .map((g) => ({ ...g, itens: g.itens.filter((i) => i.visivel(ctxMenu)) }))
    .filter((g) => g.itens.length > 0);
  const ativoId = idItemAtivo(caminho ?? "/", grupos.flatMap((g) => g.itens));
  const itemAtivo = itemPorId(ativoId);
  // Rotas filhas sem item de menu (Conversas/Kanban vivem sob Agentes de IA)
  // têm título próprio no cabeçalho, com o item do pai aceso na sidebar.
  const filha = tituloDaRota(caminho ?? "/");
  const tituloPagina = filha?.titulo ?? itemAtivo?.titulo ?? itemAtivo?.label ?? "FebraHub";
  const descPagina = filha?.desc ?? itemAtivo?.desc;

  // Navegar fecha a gaveta. Sem isto, tocar num hub troca o painel atrás de um
  // menu que continua aberto por cima dele.
  useEffect(() => { fecharMenu(); }, [caminho, fecharMenu]);

  const deslogar = async () => {
    await sair();
    qc.setQueryData(CHAVE_SESSAO, null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === "view" });
    router.replace("/login");
  };

  const ItemNav = ({ item }: { item: ItemMenu }) => {
    const ativo = ativoId === item.id;
    const { Icone } = item;
    return (
      <Link href={item.href} aria-current={ativo ? "page" : undefined}
        className="fh-item-menu"
        // Com o menu recolhido o rótulo some, então o nome vai para o title —
        // senão sobra um ícone sem nada que diga o que ele abre.
        title={recolhido ? item.label : undefined}
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
        <span className="fh-so-expandido">{item.label}</span>
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
            {grupos.map((g, i) => (
              <div key={g.id}>
                <div className="fh-grupo-menu" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: C.dim, textTransform: "uppercase", padding: `${i === 0 ? 12 : 20}px 12px 8px` }}>
                  {g.titulo(ctxMenu)}
                </div>
                {g.itens.map((item) => <ItemNav key={item.id} item={item} />)}
              </div>
            ))}
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
              {tituloPagina}
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
                  {ativoId === "executivo" ? `${saudacao}, ${primeiroNome}.` : tituloPagina}
                </h1>
                {ativoId !== "executivo" && descPagina && (
                  <div style={{ fontSize: 13, color: C.faint, marginTop: 5 }}>{descPagina}</div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Executivo, Territorial, CRM e as telas de Integrações têm
                    estado próprio na URL; o seletor global de período não age
                    sobre elas e só confundiria — dois controles de período na
                    mesma tela. As de Administração são cadastro: não têm
                    recorte de tempo nenhum. */}
                {!["executivo", "territorial", "crm", "fontes", "whatsapp", "agentes", "conversas", "kanban",
                   "organograma", "perfis", "usuarios", "comunicados", "brain"].includes(ativoId ?? "") && <SeletorPeriodo />}
                {ativoId === "comercial" && <SeletorCategoria />}
                {/* O robô abre a caixa de pergunta à memória institucional —
                    a dúvida costuma surgir NO MEIO de outra tela, e mandar a
                    pessoa até /configuracoes/brain quebraria o que ela estava
                    fazendo. */}
                {pode(perfil, "brain.ver") && <PerguntaRapida />}
                {/* Somem no celular: 40px numa barra apertada empurram o
                    filtro para outra linha, e o aviso continua chegando na
                    próxima vez que a pessoa abrir no desktop. */}
                <SinoNotificacoes />
              </div>
            </div>

            {children}
          </div>
        </main>

        {/* Widget flutuante dos agentes (porte do crm-aplopes): montado no
            Shell — e não numa página — para a conversa aberta, as não-lidas e
            a posição sobreviverem à navegação entre os hubs. Aparece para
            quem alcança o CRM, pelo cadastro ou pelo perfil de acesso. */}
        {(admin || setores.includes("crm")) && <TeamsWidget />}
      </div>
    </ProvedorPeriodo>
  );
}
