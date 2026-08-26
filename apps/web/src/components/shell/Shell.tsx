/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Menu, Moon, PanelLeftClose, PanelLeftOpen, Power, Sun, X } from "lucide-react";
import { BotaoBuscaGlobal, BuscaGlobal, useBuscaGlobal } from "@/components/shell/BuscaGlobal";
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
import {
  MENU_PRIMARIO,
  idItemAtivo,
  itemPorId,
  primarioPorCaminho,
  tituloDaRota,
  type ItemMenu,
  type MenuPrimario,
} from "@/lib/menu";
import { ProvedorPeriodo } from "@/lib/periodo";
import { C, FUNDO_APP, SANS } from "@/lib/tema";
import type { Perfil } from "@/types/views";

const CHAVE_MENU_TOTAL = "febrahub:menu-oculto-total";
const CHAVE_ACORDEAO = "febrahub:acordeao-abertos";

/** Shell: sidebar em acordeão (coluna única) + header + footer. */
export function Shell({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const caminho = usePathname() ?? "/";
  const { alternar: alternarTema } = useTema();
  const { aberto: menuAberto, alternar: alternarMenu, fechar: fecharMenu } = useMenu();
  useSessaoViva();

  const [menuOcultoTotal, setMenuOcultoTotal] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [buscaAberta, setBuscaAberta] = useBuscaGlobal();
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      setMenuOcultoTotal(localStorage.getItem(CHAVE_MENU_TOTAL) === "1");
      const salvos = localStorage.getItem(CHAVE_ACORDEAO);
      if (salvos) setAbertos(new Set(JSON.parse(salvos) as string[]));
    } catch { /* ok */ }
  }, []);

  const alternarGrupo = (id: string) => {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      try { localStorage.setItem(CHAVE_ACORDEAO, JSON.stringify([...novo])); } catch { /* ok */ }
      return novo;
    });
  };

  const setores = setoresVisiveis(perfil);
  const admin = ehAdmin(perfil);
  const ctxMenu = { admin, setores, pode: (...p: string[]) => pode(perfil, ...p) };

  const primarios = useMemo(
    () => MENU_PRIMARIO.filter((p) => p.visivel(ctxMenu)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin, setores.join("|"), perfil.id],
  );

  const filhosTodos = useMemo(
    () => primarios.flatMap((p) => p.filhos.filter((f) => f.visivel(ctxMenu))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primarios],
  );

  const ativoId = idItemAtivo(caminho, filhosTodos);
  const itemAtivo = itemPorId(ativoId);
  const primarioRota = primarioPorCaminho(caminho, ctxMenu);
  const primarioAtivo: MenuPrimario | undefined = primarioRota ?? primarios[0];

  const filha = tituloDaRota(caminho);
  const tituloPagina = filha?.titulo ?? itemAtivo?.titulo ?? itemAtivo?.label ?? "FebraHub";
  const descPagina = filha?.desc ?? itemAtivo?.desc;

  // O grupo da rota atual abre automaticamente (acordeão), sem fechar os que o
  // usuário já deixou abertos.
  useEffect(() => {
    if (primarioRota?.id) {
      setAbertos((atual) => (atual.has(primarioRota.id) ? atual : new Set(atual).add(primarioRota.id)));
    }
  }, [primarioRota?.id]);

  useEffect(() => { fecharMenu(); setMenuUsuario(false); }, [caminho, fecharMenu]);

  const deslogar = async () => {
    await sair();
    qc.setQueryData(CHAVE_SESSAO, null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] === "view" });
    router.replace("/login");
  };

  /** Oculta/restaura COMPLETAMENTE o menu do ERP (rail + submenu), devolvendo
   *  toda a largura ao conteúdo (PRD PDV §5). Persiste na sessão; sem reload. */
  const alternarMenuTotal = () => {
    setMenuOcultoTotal((v) => {
      const novo = !v;
      try { localStorage.setItem(CHAVE_MENU_TOTAL, novo ? "1" : "0"); } catch { /* ok */ }
      return novo;
    });
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

  const mostraPeriodo = !!ativoId?.endsWith("-resumo") && ativoId !== "crm-resumo";
  const mostraCategoria = ativoId === "comercial-resumo" || ativoId === "comercial";
  // Páginas "tela cheia": ocupam toda a área do conteúdo, sem o cabeçalho
  // genérico nem o max-width — para experiências imersivas tipo caixa (PDV).
  const paginaCheia = caminho.startsWith("/loja/balcao");

  return (
    <ProvedorPeriodo>
      <div className={`fh-shell${menuOcultoTotal ? " fh-shell-sem-menu" : ""}`} style={{
        minHeight: "100dvh", display: "flex", color: C.text, fontFamily: SANS,
        background: FUNDO_APP,
      }}>
        <button
          className="fh-backdrop"
          onClick={fecharMenu}
          tabIndex={menuAberto ? 0 : -1}
          aria-label="Fechar menu"
        />

        {/* ---- Sidebar em acordeão (coluna única) ---- */}
        <aside className="fh-sidebar rolagem" aria-label="Menu principal">
          <div className="fh-sidebar-topo">
            <img src="/logo-febracis.webp" alt="Febracis" width={30} height={30} />
            <div className="fh-sidebar-marca">
              <b>FebraHub</b>
              <span>Febracis Salvador</span>
            </div>
            <button type="button" className="fh-so-gaveta fh-toque" onClick={fecharMenu} aria-label="Fechar menu" style={botaoIcone}>
              <X size={18} />
            </button>
          </div>

          <nav className="fh-sidebar-nav">
            {primarios.map((p) => {
              const filhos = p.filhos.filter((f) => f.visivel(ctxMenu));
              if (!filhos.length) return null;
              const grupoAtivo = primarioAtivo?.id === p.id;
              const aberto = abertos.has(p.id) || grupoAtivo;
              const { Icone } = p;
              return (
                <div key={p.id} className={`fh-grupo${aberto ? " aberto" : ""}${grupoAtivo ? " grupo-ativo" : ""}`}>
                  <button
                    type="button"
                    className="fh-grupo-cabeca"
                    aria-expanded={aberto}
                    onClick={() => alternarGrupo(p.id)}
                  >
                    <span className="fh-grupo-ico"><Icone size={18} /></span>
                    <span className="fh-grupo-label">{p.label}</span>
                    <ChevronRight size={15} className="fh-grupo-chevron" aria-hidden />
                  </button>
                  {aberto && (
                    <div className="fh-grupo-itens">
                      {filhos.map((item) => (
                        <ItemSub key={item.id} item={item} ativo={ativoId === item.id} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="fh-sidebar-rodape">
            <Link href="/configuracoes/brain" className="fh-sidebar-memoria" title="Memória institucional — busca e respostas com a base de conhecimento">
              <BookOpenIcon />
              <span>Memória institucional</span>
            </Link>
          </div>
        </aside>

        {/* ---- Conteúdo ---- */}
        <div className="fh-shell-corpo">
          <header className="fh-header">
            <div className="fh-header-esq">
              <button
                type="button"
                className="fh-so-gaveta fh-toque"
                onClick={alternarMenu}
                aria-label="Abrir menu"
                aria-expanded={menuAberto}
                style={{ ...botaoIcone, color: C.text, padding: 4 }}
              >
                <Menu size={20} />
              </button>
              <button
                type="button"
                className="fh-so-desktop fh-toque"
                onClick={alternarMenuTotal}
                aria-label={menuOcultoTotal ? "Mostrar menu" : "Ocultar menu"}
                title={menuOcultoTotal ? "Mostrar menu" : "Ocultar menu (tela cheia)"}
                style={{ ...botaoIcone, color: C.muted }}
              >
                {menuOcultoTotal ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
              <img src="/logo-febracis.webp" alt="" width={24} height={24} className="fh-header-logo" />
              <div className="fh-header-marca">
                <b>FebraHub</b>
                <span>Febracis Salvador</span>
              </div>
            </div>

            <div className="fh-header-dir">
              <BotaoBuscaGlobal onClick={() => setBuscaAberta((v) => !v)} />
              {pode(perfil, "brain.ver") && <PerguntaRapida />}
              <SinoNotificacoes />
              <div className="fh-header-user">
                <button
                  type="button"
                  className="fh-header-avatar fh-toque"
                  onClick={() => setMenuUsuario((v) => !v)}
                  aria-expanded={menuUsuario}
                  aria-haspopup="menu"
                >
                  <span>{iniciais}</span>
                  <ChevronDown size={14} />
                </button>
                {menuUsuario && (
                  <div className="fh-header-dropdown" role="menu">
                    <div className="fh-header-dropdown-nome">
                      <b>{perfil.nome}</b>
                      <span>{admin ? "Administrador" : perfil.setor}</span>
                    </div>
                    <button type="button" role="menuitem" onClick={alternarTema}>
                      <Sun size={14} className="so-claro" />
                      <Moon size={14} className="so-escuro" />
                      Alternar tema
                    </button>
                    <button type="button" role="menuitem" onClick={deslogar}>
                      <Power size={14} /> Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className={`fh-main rolagem${paginaCheia ? " cheia" : ""}`}>
            <div className={`subir ${paginaCheia ? "fh-main-cheia" : "fh-main-inner"}`}>
              {!paginaCheia && (
                <div className="fh-page-topo">
                  <div style={{ minWidth: 0 }}>
                    <div className="fh-page-data">{hoje}</div>
                    <h1 className="fh-page-titulo">
                      {ativoId === "executivo" ? `${saudacao}, ${primeiroNome}.` : tituloPagina}
                    </h1>
                    {ativoId !== "executivo" && descPagina && (
                      <div className="fh-page-desc">{descPagina}</div>
                    )}
                  </div>
                  <div className="fh-page-acoes">
                    {mostraPeriodo && <SeletorPeriodo />}
                    {mostraCategoria && <SeletorCategoria />}
                  </div>
                </div>
              )}
              {children}
            </div>
          </main>

          <footer className="fh-footer">
            © {new Date().getFullYear()} Febracis · FebraHub — Central de Inteligência
          </footer>
        </div>

        {/* Botão flutuante para restaurar o menu quando totalmente oculto. */}
        {menuOcultoTotal && (
          <button
            type="button"
            className="fh-restaurar-menu fh-toque"
            onClick={alternarMenuTotal}
            aria-label="Mostrar menu"
            title="Mostrar menu"
          >
            <Menu size={20} />
          </button>
        )}

        {(admin || setores.includes("crm")) && <TeamsWidget />}

        {/* ── Busca Global (Ctrl+K) ── */}
        {buscaAberta && (
          <BuscaGlobal
            ctx={ctxMenu}
            aberto={buscaAberta}
            onFechar={() => setBuscaAberta(false)}
            onHandler={(handler) => {
              // Handlers especiais (ex.: abrir modais) podem ser registrados aqui
              console.info("[BuscaGlobal] handler:", handler);
            }}
          />
        )}
      </div>
    </ProvedorPeriodo>
  );
}

function ItemSub({ item, ativo }: { item: ItemMenu; ativo: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={`fh-sub-item${ativo ? " fh-sub-item-ativo" : ""}`}
    >
      {item.label}
    </Link>
  );
}

function BookOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}
