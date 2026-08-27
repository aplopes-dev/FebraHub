"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Coffee, Hamburger, IceCream, Pizza, ForkKnife, Cookie, Bread, Martini,
  Wine, Cake, Popcorn, Fish, Carrot, Pepper, Basket, Storefront, ShoppingBag,
  Star, ArrowUp, MapPin, Clock, Wallet, PencilSimple, Receipt,
  X, FloppyDisk, CaretRight, Trash, Plus,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { AcompanharPedido } from "@/components/loja/AcompanharPedido";
import { acompanharPedido, cardapioPublico, checkout, editarItensPedidoPublico, fazerPedidoBalcao } from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import type { CardapioProduto } from "@/types/loja-pedidos";
import "@/app/cardapio.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* Ícone (Phosphor) por categoria — casa por palavra-chave no nome, sem depender
   de cadastro. Fallback = Basket. Mesma categoria → mesmo ícone sempre. */
const REGRAS_ICONE: [RegExp, PhosphorIcon][] = [
  [/caf[eé]|expresso|cappuccino|coado/i, Coffee],
  [/lanche|burg|x-|sandu|hot ?dog|cachorro/i, Hamburger],
  [/pizza|esfi/i, Pizza],
  [/sorvete|gelato|a[çc]a[ií]|milk/i, IceCream],
  [/sobremesa|doce|pudim|brigadeiro|torta/i, Cake],
  [/bolo|fatia/i, Cake],
  [/biscoito|cookie|bolacha/i, Cookie],
  [/p[ãa]o|padaria|assado/i, Bread],
  [/drink|coquetel|caipirinha|gin|vodka/i, Martini],
  [/vinho|espumante/i, Wine],
  [/pipoca|snack|salgadinho/i, Popcorn],
  [/peixe|frutos do mar|sushi|sashimi/i, Fish],
  [/salada|vegano|vegetari|natural|fit/i, Carrot],
  [/tempero|molho|pimenta|condimento/i, Pepper],
  [/bebida|refri|suco|[aá]gua|cerveja|chopp|refrigerante/i, Martini],
  [/combo|kit|promo/i, ShoppingBag],
  [/prato|refei[çc]|almo[çc]|marmita|executivo/i, ForkKnife],
  [/mercado|loja|diversos|geral|produto/i, Storefront],
];
const iconeDaCategoria = (nome: string): PhosphorIcon => {
  for (const [re, Ic] of REGRAS_ICONE) if (re.test(nome)) return Ic;
  return Basket;
};

/* ---- Pedido em andamento lembrado no navegador do cliente ----
   Guarda só o id do último pedido feito neste cardápio; a tela de
   acompanhamento (/pedido/<id>) mostra senha, QR, posição na fila etc. */
const CHAVE_PEDIDO = (slug: string) => `cdp:pedido:${slug}`;
const lerPedidoLocal = (slug: string): string | null => {
  try { return localStorage.getItem(CHAVE_PEDIDO(slug)); } catch { return null; }
};
const salvarPedidoLocal = (slug: string, id: string) => {
  try { localStorage.setItem(CHAVE_PEDIDO(slug), id); } catch { /* modo privado / bloqueado */ }
};
const limparPedidoLocal = (slug: string) => {
  try { localStorage.removeItem(CHAVE_PEDIDO(slug)); } catch { /* ignore */ }
};
const FINALIZADOS = ["RETIRADO", "CANCELADO", "EXPIRADO"];
const STATUS_CURTO: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "aguardando pagamento",
  PAGAMENTO_CONFIRMADO: "pagamento confirmado",
  NA_FILA: "na fila",
  PROXIMO: "é o próximo — vá ao balcão",
  EM_PREPARACAO: "em preparação",
  PRONTO: "pronto para retirar",
};
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Paleta para diferenciar categorias sem cor cadastrada. Cor estável por nome:
   soma dos char codes → índice na paleta (mesma categoria = mesma cor sempre). */
const PALETA_CAT = ["#e9c15c", "#6aa9ff", "#57c98a", "#ef8f6d", "#c58cf0", "#59c2c9", "#e07b9a", "#c7b26a"];
const corDaCategoria = (nome: string, fallbackIdx: number) => {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h + nome.charCodeAt(i)) % PALETA_CAT.length;
  return PALETA_CAT[nome ? h : fallbackIdx % PALETA_CAT.length];
};

/* --- ícones (traço, herdam currentColor) --- */
const Icon = {
  plus: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14" /></svg>),
  cart: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L21 7H6" /></svg>),
  close: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  arrow: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  clock: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  pin: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>),
  lock: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></svg>),
  pix: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" {...p}><path d="M12 3.8 8.2 7.6a2.2 2.2 0 0 0 0 3.1L12 14.5l3.8-3.8a2.2 2.2 0 0 0 0-3.1L12 3.8ZM3.8 12l3.8 3.8L11.4 12 7.6 8.2 3.8 12ZM12.6 12l3.8 3.8L20.2 12l-3.8-3.8L12.6 12ZM8.2 16.4 12 20.2l3.8-3.8" /></svg>),
  card: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18" /></svg>),
  info: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>),
  toTop: (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 15l-6-6-6 6"/><path d="M5 21h14"/></svg>),
};

export function CardapioPublico({ slug }: { slug: string }) {
  const router = useRouter();
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [etapa, setEtapa] = useState<"catalogo" | "identificar">("catalogo");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [, setPedidoId] = useState<string | null>(null);
  const [catAtiva, setCatAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const secoesRef = useRef<Record<string, HTMLElement | null>>({});

  const cardapio = useQuery({
    queryKey: ["cardapio", slug],
    queryFn: () => cardapioPublico(slug),
  });

  // Pedido em andamento lembrado do navegador: se ainda estiver aberto, mostra
  // um aviso no topo com atalho pra tela de acompanhamento (senha, QR, fila).
  const [pedidoLembrado, setPedidoLembrado] = useState<string | null>(null);
  useEffect(() => { setPedidoLembrado(lerPedidoLocal(slug)); }, [slug]);
  const pedidoAberto = useQuery({
    queryKey: ["cardapio-pedido-aberto", pedidoLembrado],
    queryFn: () => acompanharPedido(pedidoLembrado!),
    enabled: !!pedidoLembrado && etapa === "catalogo",
    refetchInterval: 15000,
    retry: false,
  });
  useEffect(() => {
    if (!pedidoLembrado) return;
    // Some da vista (e do storage) quando o pedido finaliza ou não existe mais.
    if (pedidoAberto.isError || (pedidoAberto.data && FINALIZADOS.includes(pedidoAberto.data.status))) {
      limparPedidoLocal(slug);
      setPedidoLembrado(null);
    }
  }, [pedidoLembrado, pedidoAberto.data, pedidoAberto.isError, slug]);
  const avisoPedido = pedidoLembrado && pedidoAberto.data && !FINALIZADOS.includes(pedidoAberto.data.status)
    ? pedidoAberto.data : null;

  // ---- Modo EDIÇÃO: o cliente ajusta o próprio pedido (ainda na fila / não pago) ----
  const [edicao, setEdicao] = useState<{ pedidoId: string; numero: number; pago: boolean; totalOriginal: number } | null>(null);
  // O modal de edição fica na frente; "Adicionar itens" o esconde p/ navegar o
  // cardápio, e uma barra "voltar à edição" reabre.
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [verPedidoModal, setVerPedidoModal] = useState<string | null>(null);
  const entrarEdicao = (ped: typeof pedidoAberto.data) => {
    if (!ped || !ped.editavelPeloCliente) return;
    setCarrinho(Object.fromEntries(ped.itens.map((it) => [it.produtoId, it.quantidade])));
    setEdicao({ pedidoId: ped.id, numero: ped.numero, pago: ped.pago, totalOriginal: Number(ped.total) });
    setModalEdicaoAberto(true);
    setErro(null);
    setEtapa("catalogo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const sairEdicao = () => { setEdicao(null); setModalEdicaoAberto(false); setCarrinho({}); setErro(null); };
  // Entra em edição via ?editar=<pedidoId> (link vindo da tela de acompanhamento).
  const [editarParam, setEditarParam] = useState<string | null>(null);
  useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get("editar");
      if (id) { setEditarParam(id); router.replace(`/cardapio/${slug}`); }
    } catch { /* ignore */ }
  }, [slug, router]);
  const pedidoParaEditar = useQuery({
    queryKey: ["cardapio-editar", editarParam],
    queryFn: () => acompanharPedido(editarParam!),
    enabled: !!editarParam && !edicao,
    retry: false,
  });
  useEffect(() => {
    if (editarParam && pedidoParaEditar.data && !edicao) {
      if (pedidoParaEditar.data.editavelPeloCliente) entrarEdicao(pedidoParaEditar.data);
      else setErro("Este pedido não pode mais ser editado (já entrou em preparação).");
      setEditarParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editarParam, pedidoParaEditar.data]);

  const salvarEdicao = useMutation({
    mutationFn: () => {
      const itens = Object.entries(carrinho).map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
      return editarItensPedidoPublico(edicao!.pedidoId, itens);
    },
    onSuccess: () => {
      const id = edicao!.pedidoId;
      setEdicao(null); setCarrinho({}); setErro(null);
      router.push(`/pedido/${id}`);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Não foi possível salvar as alterações."),
  });

  const produtos = useMemo(() => cardapio.data?.produtos ?? [], [cardapio.data]);

  // Produtos em destaque: marcados emDestaque=true OU categoria "Bebidas" (case-insensitive).
  // Ordem: emDestaque primeiro, depois bebidas adicionais (sem duplicar).
  const ehBebida = (p: CardapioProduto) =>
    /bebida/i.test(p.categoria ?? "");
  const destaques = useMemo(() => {
    const set = new Set<string>();
    const result: CardapioProduto[] = [];
    for (const p of produtos) {
      if (!p.esgotado && (p.emDestaque || ehBebida(p))) {
        if (!set.has(p.produtoId)) { set.add(p.produtoId); result.push(p); }
      }
    }
    return result;
  }, [produtos]);

  // Busca: normaliza acentos e filtra por nome ou descrição
  const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return produtos;
    const q = normalizar(busca);
    return produtos.filter((p) => normalizar(p.nome).includes(q) || normalizar(p.descricao ?? "").includes(q));
  }, [produtos, busca]);

  const categorias = useMemo(() => {
    const ordem: string[] = [];
    const grupos: Record<string, CardapioProduto[]> = {};
    const cores: Record<string, string | null> = {};
    for (const p of produtosFiltrados) {
      const c = p.categoria ?? "Outros";
      if (!grupos[c]) { grupos[c] = []; ordem.push(c); cores[c] = p.categoriaCor ?? null; }
      grupos[c].push(p);
      if (!cores[c] && p.categoriaCor) cores[c] = p.categoriaCor;
    }
    // Paleta de fallback: se a categoria não tem cor cadastrada, gera uma cor
    // estável (mesma cor sempre p/ o mesmo nome) para diferenciar os grupos.
    return ordem.map((c, i) => ({ nome: c, id: slugify(c), itens: grupos[c], cor: cores[c] ?? corDaCategoria(c, i) }));
  }, [produtosFiltrados]);

  const total = useMemo(
    () => produtos.reduce((s, p) => s + (carrinho[p.produtoId] ?? 0) * p.preco, 0),
    [produtos, carrinho],
  );
  const qtdTotal = Object.values(carrinho).reduce((a, b) => a + b, 0);
  const itensCarrinho = useMemo(
    () => produtos.filter((p) => carrinho[p.produtoId]).map((p) => ({ ...p, qtd: carrinho[p.produtoId] })),
    [produtos, carrinho],
  );

  // Scroll-spy: destaca a categoria da seção mais próxima do topo.
  useEffect(() => {
    if (categorias.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visivel = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setCatAtiva(visivel.target.id);
      },
      { rootMargin: "-84px 0px -60% 0px", threshold: 0 },
    );
    for (const c of categorias) { const el = secoesRef.current[c.id]; if (el) obs.observe(el); }
    return () => obs.disconnect();
  }, [categorias]);

  const irPara = (id: string) => {
    const el = secoesRef.current[id];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
  };

  const irParaTopo = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // FAB "voltar ao topo": aparece depois de rolar ~1 tela.
  const [mostrarFabTopo, setMostrarFabTopo] = useState(false);
  useEffect(() => {
    const onScroll = () => setMostrarFabTopo(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Remove completamente um item do carrinho (botão ✕ no carrossel)
  const removerDoCarrinho = (id: string) =>
    setCarrinho((c) => { const cp = { ...c }; delete cp[id]; return cp; });

  const setQty = (id: string, delta: number, max: number | null) =>
    setCarrinho((c) => {
      const atual = c[id] ?? 0;
      let novo = atual + delta;
      if (novo < 0) novo = 0;
      if (max != null && novo > max) novo = max;
      const copia = { ...c };
      if (novo === 0) delete copia[id]; else copia[id] = novo;
      return copia;
    });

  // FAZER PEDIDO — o cardápio NÃO cobra online (sem gateway integrado): o
  // pagamento é no BALCÃO. Registra o pedido, entra na fila com senha + código
  // de retirada, e leva ao acompanhamento.
  async function finalizar() {
    setErro(null);
    setOcupado(true);
    try {
      const itens = Object.entries(carrinho).map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
      const pedido = await checkout({
        operacaoId: cardapio.data?.operacao.id,
        canal: "CARDAPIO_DIGITAL",
        clienteNome: nome.trim(),
        clienteTel: tel.replace(/\D/g, ""),
        itens,
      });
      setPedidoId(pedido.id);
      salvarPedidoLocal(slug, pedido.id); // lembra pra recuperar o acompanhamento depois
      await fazerPedidoBalcao(pedido.id); // confirma o pedido (pagamento no balcão)
      router.push(`/pedido/${pedido.id}`);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.mensagem : "Não foi possível fazer o pedido.");
      setEtapa("identificar");
    } finally {
      setOcupado(false);
    }
  }

  if (cardapio.isLoading) {
    return <div className="cdp"><div className="cdp-full"><div><div className="cdp-spinner" /><p>Carregando cardápio…</p></div></div></div>;
  }
  if (cardapio.isError) {
    return <div className="cdp"><div className="cdp-full"><p>Cardápio indisponível no momento.</p></div></div>;
  }

  const nomeOperacao = cardapio.data?.operacao.nome ?? "Loja FEBRACIS";
  const modo = cardapio.data?.operacao.modo;

  return (
    <div className={`cdp ${edicao && !modalEdicaoAberto ? "cdp--editando" : ""}`}>
      {/* ---- CAPA + CARTÃO DA LOJA (padrão iFood) ---- */}
      <div className="cdp-cover" />
      <div className="cdp-store">
        <div className="cdp-store-card">
          <div className="cdp-store-logo">
            <img src="/logo-febracis.webp" alt="FEBRACIS Bahia" />
          </div>
          <div className="cdp-store-info">
            <span className="cdp-store-tag">Loja FEBRACIS</span>
            <h1>{nomeOperacao}</h1>
            <div className="cdp-store-meta">
              <span className="cdp-chip-info"><MapPin weight="fill" />{modo === "SERVICO_MESA" ? "Serviço na mesa" : "Retirada no balcão"}</span>
              <span className="cdp-chip-info"><Clock weight="fill" />Pronto na hora</span>
              <span className="cdp-chip-info"><Wallet weight="fill" />Pague no balcão</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Barra "voltar à edição": só quando o modal está escondido p/ o
              cliente escolher itens no cardápio. ---- */}
      {edicao && !modalEdicaoAberto && (
        <div className="cdp-edit-bar" role="status">
          <span className="cdp-edit-bar-ic" aria-hidden><PencilSimple weight="fill" /></span>
          <div className="cdp-edit-bar-txt">
            <b>Adicionando ao pedido #{edicao.numero}</b>
            <small>Toque nos itens e volte para revisar.</small>
          </div>
          <button type="button" className="cdp-edit-bar-sair" onClick={sairEdicao} aria-label="Cancelar edição">
            <X weight="bold" /> Cancelar
          </button>
          <button type="button" className="cdp-edit-bar-salvar" onClick={() => setModalEdicaoAberto(true)}>
            <PencilSimple weight="fill" /> Revisar ({qtdTotal})
          </button>
        </div>
      )}

      {/* ---- PEDIDO EM ANDAMENTO (recuperado do navegador) ---- */}
      {!edicao && avisoPedido && etapa === "catalogo" && (
        <div className="cdp-pedido-aberto">
          <span className="cdp-pedido-aberto-ic" aria-hidden><Receipt weight="fill" /></span>
          <span className="cdp-pedido-aberto-txt">
            <b>Pedido #{avisoPedido.numero} em andamento</b>
            <small>
              {STATUS_CURTO[avisoPedido.status] ?? "acompanhe seu pedido"}
              {avisoPedido.posicao != null && (avisoPedido.status === "NA_FILA" || avisoPedido.status === "EM_PREPARACAO")
                ? ` · ${avisoPedido.posicao}º na fila` : ""}
            </small>
          </span>
          <span className="cdp-pedido-aberto-acoes">
            {avisoPedido.editavelPeloCliente && (
              <button type="button" className="cdp-pedido-aberto-editar" onClick={() => entrarEdicao(avisoPedido)}>
                <PencilSimple weight="bold" /> Editar
              </button>
            )}
            <button type="button" className="cdp-pedido-aberto-cta" onClick={() => setVerPedidoModal(pedidoLembrado)}>
              Ver pedido <CaretRight weight="bold" />
            </button>
          </span>
        </div>
      )}

      {/* ---- BARRA DE BUSCA ---- */}
      <div className="cdp-busca-wrap">
        <div className="cdp-busca">
          <svg className="cdp-busca-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="cdp-busca-inp"
            type="search"
            placeholder="Buscar no cardápio…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button className="cdp-busca-limpar" onClick={() => setBusca("")} aria-label="Limpar busca">
              <Icon.close />
            </button>
          )}
        </div>
      </div>

      {/* ---- NAV DE CATEGORIAS + botão Voltar ao Topo ---- */}
      {categorias.length > 1 && !busca && (
        <nav className="cdp-nav">
          <div className="cdp-nav-inner">
            {/* Botão Voltar ao Topo — âncora fixa no início da barra */}
            <button
              className="cdp-chip cdp-chip-topo"
              onClick={irParaTopo}
              title="Voltar ao topo"
              aria-label="Voltar ao topo"
            >
              <Storefront className="cdp-chip-ic" weight="fill" aria-hidden />
              <span>Início</span>
            </button>
            {categorias.map((c) => {
              const Ic = iconeDaCategoria(c.nome);
              const ativo = catAtiva === c.id;
              return (
                <button
                  key={c.id}
                  className={`cdp-chip ${ativo ? "on" : ""}`}
                  style={{ ["--cat" as string]: c.cor }}
                  onClick={() => irPara(c.id)}
                  aria-current={ativo ? "true" : undefined}
                >
                  <Ic className="cdp-chip-ic" weight={ativo ? "fill" : "regular"} aria-hidden />
                  <span>{c.nome}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ---- CATÁLOGO + CARRINHO ---- */}
      <main className="cdp-main">
        <div className="cdp-layout">
          <div>
            {/* ---- DESTAQUES (carrossel horizontal) ---- */}
            {destaques.length > 0 && !busca && (
              <section className="cdp-destaques">
                <div className="cdp-secao-head cdp-secao-destaque">
                  <span className="cdp-secao-ic-wrap" aria-hidden><Star className="cdp-secao-ic" weight="fill" /></span>
                  <h2>Destaques</h2>
                </div>
                <div className="cdp-destaques-rail">
                  {destaques.map((p) => {
                    const q = carrinho[p.produtoId] ?? 0;
                    return (
                      <article key={p.produtoId} className="cdp-destaque-card">
                        {/* ✕ remove item do carrinho — só quando qty > 0 */}
                        {q > 0 && (
                          <button
                            className="cdp-destaque-remover"
                            onClick={() => removerDoCarrinho(p.produtoId)}
                            aria-label={`Remover ${p.nome} do carrinho`}
                            title="Remover do carrinho"
                          >
                            <Icon.close style={{ width: 10, height: 10 }} />
                          </button>
                        )}
                        {/* SEM imagem — só texto */}
                        <div className="cdp-destaque-body">
                          <h3 className="cdp-destaque-nome">{p.nome}</h3>
                          {p.descricao && (
                            <p className="cdp-destaque-desc">{p.descricao}</p>
                          )}
                          <div className="cdp-destaque-foot">
                            <span className="cdp-preco">{brl(p.preco)}</span>
                            {q === 0 ? (
                              <button className="cdp-add cdp-add-sm" onClick={() => setQty(p.produtoId, 1, p.disponivel)} aria-label={`Adicionar ${p.nome}`}>
                                <Icon.plus />Adicionar
                              </button>
                            ) : (
                              <div className="cdp-step">
                                <button onClick={() => setQty(p.produtoId, -1, p.disponivel)} aria-label="Remover um">−</button>
                                <b>{q}</b>
                                <button onClick={() => setQty(p.produtoId, 1, p.disponivel)} aria-label="Adicionar um">+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Resultado de busca vazio */}
            {busca && produtosFiltrados.length === 0 && (
              <div className="cdp-full" style={{ minHeight: 200 }}>
                <p>Nenhum item encontrado para &ldquo;<b>{busca}</b>&rdquo;.</p>
              </div>
            )}

            {produtos.length === 0 && !busca && (
              <div className="cdp-full" style={{ minHeight: 240 }}><p>Nenhum item disponível no momento.</p></div>
            )}
            {categorias.map((c) => {
              const IcCat = iconeDaCategoria(c.nome);
              return (
              <section
                key={c.id}
                id={c.id}
                className="cdp-secao"
                style={{ ["--cat" as string]: c.cor }}
                ref={(el) => { secoesRef.current[c.id] = el; }}
              >
                <div className="cdp-secao-head">
                  <span className="cdp-secao-ic-wrap" aria-hidden><IcCat className="cdp-secao-ic" weight="fill" /></span>
                  <h2>{c.nome}</h2>
                  <span className="cdp-secao-cont">{c.itens.length} {c.itens.length === 1 ? "item" : "itens"}</span>
                </div>
                <div className="cdp-grid">
                  {c.itens.map((p) => {
                    const q = carrinho[p.produtoId] ?? 0;
                    const baixo = !p.esgotado && p.disponivel != null && p.disponivel <= 5;
                    return (
                      <article key={p.produtoId} className={`cdp-card ${p.esgotado ? "esgotado" : ""}`}>
                        <div className="cdp-card-body">
                          <h3 className="cdp-card-nome">{p.nome}</h3>
                          {p.descricao && <p className="cdp-card-desc">{p.descricao}</p>}
                          {baixo && <span className="cdp-card-tag">Últimas unidades</span>}
                          <div className="cdp-card-foot">
                            {p.esgotado ? (
                              <span className="cdp-esgotado-lbl">Indisponível</span>
                            ) : (
                              <span className="cdp-preco">{brl(p.preco)}</span>
                            )}
                            {!p.esgotado && (q === 0 ? (
                              <button className="cdp-add" onClick={() => setQty(p.produtoId, 1, p.disponivel)} aria-label={`Adicionar ${p.nome}`}>
                                <Icon.plus />Adicionar
                              </button>
                            ) : (
                              <div className="cdp-step">
                                <button onClick={() => setQty(p.produtoId, -1, p.disponivel)} aria-label="Remover um">−</button>
                                <b>{q}</b>
                                <button onClick={() => setQty(p.produtoId, 1, p.disponivel)} aria-label="Adicionar um">+</button>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* SEM cdp-card-media — imagens removidas */}
                      </article>
                    );
                  })}
                </div>
              </section>
              );
            })}
          </div>

          {/* ---- CARRINHO LATERAL (desktop) ---- */}
          <aside className="cdp-cart-side">
            <div className="cdp-cart-head">
              <Icon.cart />Sacola
              <span>{qtdTotal} {qtdTotal === 1 ? "item" : "itens"}</span>
            </div>
            <div className="cdp-cart-body">
              {itensCarrinho.length === 0 ? (
                <div className="cdp-cart-empty">
                  <Icon.cart /><p>Sua sacola está vazia.<br />Adicione itens do cardápio.</p>
                </div>
              ) : (
                itensCarrinho.map((p) => (
                  <div key={p.produtoId} className="cdp-cart-item">
                    <div className="cdp-cart-thumb-txt">{p.nome.charAt(0)}</div>
                    <div className="nm">
                      <b>{p.nome}</b>
                      <small>{brl(p.preco)} · un.</small>
                    </div>
                    <div className="cdp-cart-mini">
                      <button onClick={() => setQty(p.produtoId, -1, p.disponivel)}>−</button>
                      <b>{p.qtd}</b>
                      <button onClick={() => setQty(p.produtoId, 1, p.disponivel)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {itensCarrinho.length > 0 && (
              <div className="cdp-cart-foot">
                <div className="cdp-cart-row"><span>Subtotal</span><span>{brl(total)}</span></div>
                <div className="cdp-cart-row total"><span>Total</span><span>{brl(total)}</span></div>
                {edicao ? (
                  <>
                    {erro && <div className="cdp-erro" style={{ marginBottom: 8 }}>{erro}</div>}
                    <button className="cdp-cta" disabled={salvarEdicao.isPending} onClick={() => salvarEdicao.mutate()}>
                      {salvarEdicao.isPending ? "Salvando…" : "Salvar alterações"}
                    </button>
                  </>
                ) : (
                  <button className="cdp-cta" onClick={() => setEtapa("identificar")}>
                    Continuar <Icon.arrow />
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ---- BARRA FLUTUANTE (mobile) ---- */}
      {qtdTotal > 0 && etapa === "catalogo" && (
        <div className="cdp-cart-bar">
          {edicao ? (
            <button disabled={salvarEdicao.isPending} onClick={() => salvarEdicao.mutate()}>
              <span className="qtd"><span className="pill">{qtdTotal}</span>{salvarEdicao.isPending ? "Salvando…" : "Salvar alterações"}</span>
              <span className="val">{brl(total)}<Icon.arrow /></span>
            </button>
          ) : (
            <button onClick={() => setEtapa("identificar")}>
              <span className="qtd"><span className="pill">{qtdTotal}</span>Ver sacola</span>
              <span className="val">{brl(total)}<Icon.arrow /></span>
            </button>
          )}
        </div>
      )}

      {/* ---- CHECKOUT (identificação + pagamento) ---- */}
      {etapa === "identificar" && (
        <>
          <button className="cdp-sheet-veu" aria-label="Fechar" onClick={() => setEtapa("catalogo")} />
          <div className="cdp-sheet" role="dialog" aria-modal="true">
            <div className="cdp-sheet-grip" />
            <div className="cdp-sheet-inner">
              <div className="cdp-sheet-head">
                <div>
                  <h2>Finalizar pedido</h2>
                  <p>Confira os itens e informe seus dados.</p>
                </div>
                <button className="cdp-sheet-x" onClick={() => setEtapa("catalogo")} aria-label="Voltar"><Icon.close /></button>
              </div>

              <div className="cdp-resumo">
                {itensCarrinho.map((p) => (
                  <div key={p.produtoId} className="cdp-resumo-row">
                    <span className="l"><b>{p.qtd}×</b> {p.nome}</span>
                    <span className="r">{brl(p.preco * p.qtd)}</span>
                  </div>
                ))}
                <div className="cdp-resumo-total"><span>Total</span><span>{brl(total)}</span></div>
              </div>

              <label className="cdp-field">
                <span>Nome</span>
                <input className="cdp-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
              </label>
              <label className="cdp-field">
                <span>WhatsApp</span>
                <input className="cdp-input" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="(71) 90000-0000" inputMode="tel" />
              </label>

              <div className="cdp-pay-note">
                <Icon.info />
                <span>O pagamento é feito no <b>balcão</b>, na hora de retirar. Você recebe um código de retirada ao fazer o pedido.</span>
              </div>

              {erro && <div className="cdp-erro">{erro}</div>}
              <button className="cdp-cta" style={{ marginTop: 6 }} disabled={ocupado || nome.trim().length < 2} onClick={finalizar}>
                {ocupado ? "Enviando…" : `Fazer pedido · ${brl(total)}`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- MODAL DE EDIÇÃO DO PEDIDO ---- */}
      {edicao && modalEdicaoAberto && (
        <>
          <button className="cdp-sheet-veu" aria-label="Fechar" onClick={() => setModalEdicaoAberto(false)} />
          <div className="cdp-sheet cdp-edit-modal" role="dialog" aria-modal="true" aria-label={`Editar pedido ${edicao.numero}`}>
            <div className="cdp-sheet-grip" />
            <div className="cdp-sheet-inner">
              <div className="cdp-edit-modal-head">
                <span className="cdp-edit-modal-ic" aria-hidden><PencilSimple weight="fill" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2>Editar pedido</h2>
                  <p className="cdp-edit-modal-sub">Pedido #{edicao.numero} · pagamento no balcão</p>
                </div>
                <button className="cdp-sheet-x" onClick={() => setModalEdicaoAberto(false)} aria-label="Fechar"><X weight="bold" /></button>
              </div>

              {itensCarrinho.length === 0 ? (
                <div className="cdp-edit-vazio">
                  <Receipt weight="thin" />
                  <p>Sem itens. Adicione algo do cardápio ou cancele a edição.</p>
                </div>
              ) : (
                <div className="cdp-edit-lista">
                  {itensCarrinho.map((p) => (
                    <div key={p.produtoId} className="cdp-edit-item">
                      <div className="cdp-edit-item-nm">
                        <b>{p.nome}</b>
                        <small>{brl(p.preco)} · un</small>
                      </div>
                      <div className="cdp-edit-item-stepper">
                        <button onClick={() => setQty(p.produtoId, -1, p.disponivel)} aria-label="Menos um"><span>−</span></button>
                        <b>{p.qtd}</b>
                        <button onClick={() => setQty(p.produtoId, +1, p.disponivel)} disabled={p.disponivel != null && p.qtd >= p.disponivel} aria-label="Mais um"><span>+</span></button>
                      </div>
                      <button className="cdp-edit-item-rm" onClick={() => removerDoCarrinho(p.produtoId)} aria-label="Remover"><Trash weight="bold" /></button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="cdp-edit-add"
                onClick={() => { setModalEdicaoAberto(false); irParaTopo(); }}
              >
                <Plus weight="bold" /> Adicionar itens do cardápio
              </button>

              <div className="cdp-edit-total">
                <span>Novo total</span>
                <b>{brl(total)}</b>
              </div>
              {edicao.totalOriginal !== total && (
                <p className="cdp-edit-delta">
                  Total original: {brl(edicao.totalOriginal)}
                </p>
              )}

              {erro && <div className="cdp-erro" style={{ marginTop: 12 }}>{erro}</div>}
            </div>

            <div className="cdp-edit-modal-foot">
              <button type="button" className="cdp-cta ghost" onClick={sairEdicao}>Cancelar edição</button>
              <button
                type="button"
                className="cdp-cta"
                disabled={salvarEdicao.isPending || itensCarrinho.length === 0}
                onClick={() => salvarEdicao.mutate()}
              >
                <FloppyDisk weight="fill" /> {salvarEdicao.isPending ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- MODAL "VER PEDIDO" (acompanhamento dentro do cardápio) ---- */}
      {verPedidoModal && (
        <>
          <button className="cdp-sheet-veu" aria-label="Fechar" onClick={() => setVerPedidoModal(null)} />
          <div className="cdp-sheet cdp-ver-modal" role="dialog" aria-modal="true" aria-label="Acompanhar pedido">
            <div className="cdp-sheet-grip" />
            <AcompanharPedido id={verPedidoModal} emModal onFechar={() => setVerPedidoModal(null)} />
          </div>
        </>
      )}

      {/* ---- FAB voltar ao topo ---- */}
      <button
        type="button"
        className={`cdp-fab-topo ${mostrarFabTopo ? "on" : ""}`}
        onClick={irParaTopo}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <ArrowUp weight="bold" />
      </button>
    </div>
  );
}
