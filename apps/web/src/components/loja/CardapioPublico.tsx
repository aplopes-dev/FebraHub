"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ForkKnife } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { acompanharPedido, cardapioPublico, checkout, confirmarPagamentoPublico, iniciarPagamento } from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import type { CardapioProduto, LojaPedidoPagamento } from "@/types/loja-pedidos";
import "@/app/cardapio.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
};

export function CardapioPublico({ slug }: { slug: string }) {
  const router = useRouter();
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [etapa, setEtapa] = useState<"catalogo" | "identificar" | "pix">("catalogo");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [pix, setPix] = useState<LojaPedidoPagamento | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [forma, setForma] = useState<"PIX" | "CARTAO_CREDITO">("PIX");
  const [cartao, setCartao] = useState({ numero: "", titular: "", validade: "", cvv: "", cpfCnpj: "" });
  const [catAtiva, setCatAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const secoesRef = useRef<Record<string, HTMLElement | null>>({});

  const cardapio = useQuery({
    queryKey: ["cardapio", slug],
    queryFn: () => cardapioPublico(slug),
  });

  // Enquanto aguarda pagamento, checa o status: o webhook do ASAAS confirma e o
  // pedido sai de AGUARDANDO_PAGAMENTO — aí levamos o cliente ao acompanhamento.
  const statusPedido = useQuery({
    queryKey: ["cardapio-status", pedidoId],
    queryFn: () => acompanharPedido(pedidoId!),
    enabled: etapa === "pix" && !!pedidoId,
    refetchInterval: 4000,
  });
  useEffect(() => {
    if (etapa === "pix" && pedidoId && statusPedido.data && statusPedido.data.status !== "AGUARDANDO_PAGAMENTO") {
      router.push(`/pedido/${pedidoId}`);
    }
  }, [etapa, pedidoId, statusPedido.data, router]);

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

  async function finalizar() {
    setErro(null);
    if (forma === "CARTAO_CREDITO") {
      const [mes, ano] = cartao.validade.split("/").map((s) => s.trim());
      if (cartao.numero.replace(/\s/g, "").length < 13 || !cartao.titular || !mes || !ano || cartao.cvv.length < 3) {
        setErro("Preencha os dados do cartão corretamente."); return;
      }
    }
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

      if (forma === "CARTAO_CREDITO") {
        // Cartão: o backend cobra tokenizado no ASAAS e confirma na hora.
        const [mes, ano] = cartao.validade.split("/").map((s) => s.trim());
        await iniciarPagamento(pedido.id, {
          forma: "CARTAO_CREDITO",
          cartao: {
            numero: cartao.numero.replace(/\s/g, ""), titular: cartao.titular,
            validadeMes: mes, validadeAno: ano.length === 2 ? `20${ano}` : ano,
            cvv: cartao.cvv, cpfCnpj: cartao.cpfCnpj, telefone: tel.replace(/\D/g, ""),
          },
        });
        // Aprovado → o pedido sai de AGUARDANDO_PAGAMENTO; leva ao acompanhamento.
        router.push(`/pedido/${pedido.id}`);
        return;
      }

      // PIX: gera a cobrança no gateway (ASAAS) e mostra o QR + copia-e-cola.
      const pagamento = await iniciarPagamento(pedido.id, { forma: "PIX" });
      setPix(pagamento);
      setEtapa("pix");
    } catch (e) {
      setErro(e instanceof ErroApi ? e.mensagem : "Não foi possível finalizar o pedido.");
      setEtapa("identificar");
    } finally {
      setOcupado(false);
    }
  }

  // Fallback dev/homolog (sem gateway): permite marcar como pago manualmente.
  async function simularPago() {
    if (!pedidoId) return;
    setErro(null);
    try {
      await confirmarPagamentoPublico(pedidoId, {});
      router.push(`/pedido/${pedidoId}`);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.mensagem : "Aguardando confirmação do pagamento.");
    }
  }

  async function copiarPix() {
    if (!pix?.pixCopiaCola) return;
    try { await navigator.clipboard.writeText(pix.pixCopiaCola); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sem clipboard */ }
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
    <div className="cdp">
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
              <span className="cdp-chip-info"><Icon.pin />{modo === "SERVICO_MESA" ? "Serviço na mesa" : "Retirada no balcão"}</span>
              <span className="dot" />
              <span className="cdp-chip-info"><Icon.clock />Pronto na hora</span>
              <span className="dot" />
              <span className="cdp-chip-info"><Icon.pix />PIX & Cartão</span>
            </div>
          </div>
        </div>
      </div>

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

      {/* ---- NAV DE CATEGORIAS ---- */}
      {categorias.length > 1 && !busca && (
        <nav className="cdp-nav">
          <div className="cdp-nav-inner">
            {categorias.map((c) => (
              <button
                key={c.id}
                className={`cdp-chip ${catAtiva === c.id ? "on" : ""}`}
                style={{ ["--cat" as string]: c.cor }}
                onClick={() => irPara(c.id)}
              >
                <span className="cdp-chip-dot" aria-hidden />
                {c.nome}
              </button>
            ))}
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
                <div className="cdp-secao-head">
                  <span className="cdp-destaque-star" aria-hidden>⭐</span>
                  <h2>Destaques</h2>
                </div>
                <div className="cdp-destaques-rail">
                  {destaques.map((p) => {
                    const q = carrinho[p.produtoId] ?? 0;
                    return (
                      <article key={p.produtoId} className="cdp-destaque-card">
                        <div className="cdp-destaque-media">
                          {p.imagemUrl
                            ? <img src={p.imagemUrl} alt={p.nome} loading="lazy" />
                            : <div className="ph"><ForkKnife weight="fill" /></div>}
                        </div>
                        <div className="cdp-destaque-body">
                          <h3 className="cdp-destaque-nome">{p.nome}</h3>
                          <span className="cdp-preco">{brl(p.preco)}</span>
                          {q === 0 ? (
                            <button className="cdp-add" onClick={() => setQty(p.produtoId, 1, p.disponivel)} aria-label={`Adicionar ${p.nome}`}>
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
            {categorias.map((c) => (
              <section
                key={c.id}
                id={c.id}
                className="cdp-secao"
                style={{ ["--cat" as string]: c.cor }}
                ref={(el) => { secoesRef.current[c.id] = el; }}
              >
                <div className="cdp-secao-head">
                  <span className="cdp-secao-cor" aria-hidden />
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
                        <div className="cdp-card-media">
                          {p.imagemUrl ? <img src={p.imagemUrl} alt={p.nome} loading="lazy" /> : <div className="ph"><ForkKnife weight="fill" /></div>}
                          {p.esgotado ? (
                            <span className="cdp-card-tag zero">Esgotado</span>
                          ) : baixo ? (
                            <span className="cdp-card-tag baixo">Últimas</span>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
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
                    <div className="cdp-cart-thumb">{p.imagemUrl ? <img src={p.imagemUrl} alt="" /> : <ForkKnife className="cdp-cart-thumb-ph" weight="fill" />}</div>
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
                <button className="cdp-cta" onClick={() => setEtapa("identificar")}>
                  Continuar <Icon.arrow />
                </button>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ---- BARRA FLUTUANTE (mobile) ---- */}
      {qtdTotal > 0 && etapa === "catalogo" && (
        <div className="cdp-cart-bar">
          <button onClick={() => setEtapa("identificar")}>
            <span className="qtd"><span className="pill">{qtdTotal}</span>Ver sacola</span>
            <span className="val">{brl(total)}<Icon.arrow /></span>
          </button>
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

              <p className="cdp-pay-label">Forma de pagamento</p>
              <div className="cdp-pay">
                <button type="button" className={forma === "PIX" ? "on" : ""} onClick={() => setForma("PIX")}><Icon.pix />PIX</button>
                <button type="button" className={forma === "CARTAO_CREDITO" ? "on" : ""} onClick={() => setForma("CARTAO_CREDITO")}><Icon.card />Cartão</button>
              </div>

              {forma === "CARTAO_CREDITO" && (
                <div style={{ marginTop: 14 }}>
                  <label className="cdp-field">
                    <span>Número do cartão</span>
                    <input className="cdp-input" value={cartao.numero} onChange={(e) => setCartao((c) => ({ ...c, numero: e.target.value }))} placeholder="0000 0000 0000 0000" inputMode="numeric" />
                  </label>
                  <label className="cdp-field">
                    <span>Nome impresso no cartão</span>
                    <input className="cdp-input" value={cartao.titular} onChange={(e) => setCartao((c) => ({ ...c, titular: e.target.value }))} placeholder="Como está no cartão" />
                  </label>
                  <div className="cdp-row2">
                    <label className="cdp-field">
                      <span>Validade</span>
                      <input className="cdp-input" value={cartao.validade} onChange={(e) => setCartao((c) => ({ ...c, validade: e.target.value }))} placeholder="MM/AA" inputMode="numeric" />
                    </label>
                    <label className="cdp-field">
                      <span>CVV</span>
                      <input className="cdp-input" value={cartao.cvv} onChange={(e) => setCartao((c) => ({ ...c, cvv: e.target.value }))} placeholder="123" inputMode="numeric" />
                    </label>
                  </div>
                  <label className="cdp-field">
                    <span>CPF do titular</span>
                    <input className="cdp-input" value={cartao.cpfCnpj} onChange={(e) => setCartao((c) => ({ ...c, cpfCnpj: e.target.value }))} placeholder="000.000.000-00" inputMode="numeric" />
                  </label>
                  <div className="cdp-safe"><Icon.lock />Pagamento seguro via ASAAS. Não guardamos os dados do seu cartão.</div>
                </div>
              )}

              {erro && <div className="cdp-erro">{erro}</div>}
              <button className="cdp-cta" style={{ marginTop: 6 }} disabled={ocupado || nome.trim().length < 2} onClick={finalizar}>
                {ocupado ? "Processando…" : forma === "PIX" ? `Pagar ${brl(total)} com PIX` : `Pagar ${brl(total)} no cartão`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- PIX ---- */}
      {etapa === "pix" && (
        <>
          <div className="cdp-sheet-veu" />
          <div className="cdp-sheet" role="dialog" aria-modal="true">
            <div className="cdp-sheet-grip" />
            <div className="cdp-sheet-inner cdp-pix">
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>Pague com PIX</h2>
              <div className="cdp-pix-valor" style={{ marginTop: 12 }}>
                {brl(total)}
                <small>Escaneie o QR ou copie o código</small>
              </div>
              {pix?.pixQrcode ? (
                <img className="cdp-pix-qr" src={pix.pixQrcode} alt="QR Code PIX" />
              ) : pix?.pixCopiaCola ? null : (
                <p style={{ fontSize: 13, color: "var(--cdp-muted)", margin: "22px 0" }}>Gerando cobrança…</p>
              )}
              {pix?.pixCopiaCola && (
                <div className="cdp-pix-copy">
                  <input readOnly value={pix.pixCopiaCola} onFocus={(e) => e.currentTarget.select()} />
                  <button onClick={copiarPix}>{copiado ? "Copiado!" : "Copiar"}</button>
                </div>
              )}
              <div className="cdp-pix-wait"><span className="dot" />Aguardando confirmação do pagamento…</div>
              {erro && <div className="cdp-erro" style={{ marginTop: 14 }}>{erro}</div>}
              {/* Só aparece quando não há gateway configurado (dev/homolog). */}
              {!pix?.pixQrcode && (
                <button className="cdp-cta ghost" style={{ marginTop: 16 }} onClick={simularPago}>Já paguei (homolog)</button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
