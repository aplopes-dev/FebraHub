/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Menu, Moon, PanelLeftClose, PanelLeftOpen, Power, Sun, X } from "lucide-react";
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

const CHAVE_SUBMENU = "febrahub:submenu-oculto";
const CHAVE_MENU_TOTAL = "febrahub:menu-oculto-total";

/** Shell dual: rail de ícones + submenu + header + footer. */
export function Shell({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const caminho = usePathname() ?? "/";
  const { alternar: alternarTema } = useTema();
  const { aberto: menuAberto, alternar: alternarMenu, fechar: fecharMenu } = useMenu();
  useSessaoViva();

  const [submenuOculto, setSubmenuOculto] = useState(false);
  const [menuOcultoTotal, setMenuOcultoTotal] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [primarioManual, setPrimarioManual] = useState<string | null>(null);
  const [buscaAberta, setBuscaAberta] = useBuscaGlobal();

  useEffect(() => {
    try {
      setSubmenuOculto(localStorage.getItem(CHAVE_SUBMENU) === "1");
      setMenuOcultoTotal(localStorage.getItem(CHAVE_MENU_TOTAL) === "1");
    } catch { /* ok */ }
  }, []);

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
  const primarioAtivo: MenuPrimario | undefined =
    primarios.find((p) => p.id === primarioManual) ??
    primarioRota ??
    primarios[0];

  const filhosAtivos = useMemo(
    () => (primarioAtivo ? primarioAtivo.filhos.filter((f) => f.visivel(ctxMenu)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primarioAtivo?.id, admin, setores.join("|")],
  );

  const filha = tituloDaRota(caminho);
  const tituloPagina = filha?.titulo ?? itemAtivo?.titulo ?? itemAtivo?.label ?? "FebraHub";
  const descPagina = filha?.desc ?? itemAtivo?.desc;

  useEffect(() => { fecharMenu(); setMenuUsuario(false); }, [caminho, fecharMenu]);
  useEffect(() => {
    // Ao mudar de rota, o rail acompanha o grupo da URL.
    setPrimarioManual(null);
  }, [caminho]);

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
      <div className={`fh-shell${submenuOculto ? " fh-shell-sem-sub" : ""}${menuOcultoTotal ? " fh-shell-sem-menu" : ""}`} style={{
        minHeight: "100dvh", display: "flex", color: C.text, fontFamily: SANS,
        background: FUNDO_APP,
      }}>
        <button
          className="fh-backdrop"
          onClick={fecharMenu}
          tabIndex={menuAberto ? 0 : -1}
          aria-label="Fechar menu"
        />

        {/* ---- Rail de ícones ---- */}
        <aside className="fh-rail rolagem" aria-label="Menu principal" aria-hidden={menuAberto ? undefined : undefined}>
          <div className="fh-rail-topo">
            <img src="/logo-febracis.webp" alt="Febracis" width={36} height={36} />
          </div>
          <nav className="fh-rail-nav">
            {primarios.map((p) => {
              const ativo = primarioAtivo?.id === p.id;
              const { Icone } = p;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`fh-rail-item${ativo ? " fh-rail-item-ativo" : ""}`}
                  aria-current={ativo ? "true" : undefined}
                  title={p.label}
                  onClick={() => {
                    setPrimarioManual(p.id);
                    setSubmenuOculto(false);
                    try { localStorage.setItem(CHAVE_SUBMENU, "0"); } catch { /* ok */ }
                    // Se o grupo tem um único filho (ou Resumo), navega direto.
                    const filhos = p.filhos.filter((f) => f.visivel(ctxMenu));
                    const resumo = filhos.find((f) => f.href === `/${p.id}`) ?? filhos[0];
                    if (resumo && (!ativo || caminho !== resumo.href)) {
                      // Só navega se clicou noutro grupo ou ainda não está no resumo.
                      if (primarioAtivo?.id !== p.id) router.push(resumo.href);
                    }
                  }}
                >
                  <Icone size={20} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="fh-rail-ajuda">
            <Link href="/configuracoes/brain" className="fh-rail-item" title="Memória institucional — busca e respostas com a base de conhecimento">
              <BookOpenIcon />
              <span>Memória</span>
            </Link>
          </div>
        </aside>

        {/* ---- Submenu ---- */}
        <aside
          className="fh-submenu rolagem"
          aria-label={`Submenu ${primarioAtivo?.label ?? ""}`}
          hidden={submenuOculto}
        >
          <div className="fh-submenu-cabeca">
            <span>{primarioAtivo?.label ?? "Menu"}</span>
            <button type="button" className="fh-so-gaveta fh-toque" onClick={fecharMenu} aria-label="Fechar" style={botaoIcone}>
              <X size={18} />
            </button>
          </div>
          <nav className="fh-submenu-nav">
            {filhosAtivos.map((item) => (
              <ItemSub key={item.id} item={item} ativo={ativoId === item.id} />
            ))}
          </nav>
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

          <main className="fh-main rolagem">
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
