"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { acompanharPedido, cardapioPublico, checkout, confirmarPagamentoPublico, iniciarPagamento } from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import type { CardapioProduto, LojaPedidoPagamento } from "@/types/loja-pedidos";
import "@/app/fila.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  const produtos = cardapio.data?.produtos ?? [];
  const porCategoria = useMemo(() => {
    const grupos: Record<string, CardapioProduto[]> = {};
    for (const p of produtos) {
      const c = p.categoria ?? "Outros";
      (grupos[c] ??= []).push(p);
    }
    return grupos;
  }, [produtos]);

  const total = useMemo(
    () => produtos.reduce((s, p) => s + (carrinho[p.produtoId] ?? 0) * p.preco, 0),
    [produtos, carrinho],
  );
  const qtdTotal = Object.values(carrinho).reduce((a, b) => a + b, 0);

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
      // Gera a cobrança PIX no gateway (ASAAS) e mostra o QR + copia-e-cola.
      const pagamento = await iniciarPagamento(pedido.id, { forma: "PIX" });
      setPix(pagamento);
      setEtapa("pix");
    } catch (e) {
      setErro(e instanceof ErroApi ? e.mensagem : "Não foi possível finalizar o pedido.");
      setEtapa("catalogo");
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

  if (cardapio.isLoading) return <div className="acomp-page"><p>Carregando cardápio…</p></div>;
  if (cardapio.isError) return <div className="acomp-page"><p>Cardápio indisponível no momento.</p></div>;

  if (etapa === "identificar") {
    return (
      <div className="acomp-page">
        <div className="acomp-card">
          <h1>Quase lá</h1>
          <p className="st">Como avisamos quando ficar pronto</p>
          <div style={{ display: "grid", gap: 12, margin: "22px 0", textAlign: "left" }}>
            <label style={{ fontSize: 12 }}>Nome
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" style={inputStyle} />
            </label>
            <label style={{ fontSize: 12 }}>WhatsApp
              <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="(71) 90000-0000" inputMode="tel" style={inputStyle} />
            </label>
          </div>
          {erro && <p style={{ color: "#e06c75", fontSize: 13 }}>{erro}</p>}
          <button className="loja-btn ouro" style={{ width: "100%", justifyContent: "center" }}
            disabled={ocupado || nome.trim().length < 2}
            onClick={finalizar}>
            {ocupado ? "Processando…" : `Pagar ${brl(total)}`}
          </button>
          <button className="loja-btn" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => setEtapa("catalogo")}>Voltar</button>
        </div>
      </div>
    );
  }

  if (etapa === "pix") {
    return (
      <div className="acomp-page">
        <div className="acomp-card">
          <h1>Pague com PIX</h1>
          <p className="st">{brl(total)}</p>
          {pix?.pixQrcode && (
            // QR do gateway (imagem base64) — some styling reaproveitado da fila.css
            <img src={pix.pixQrcode} alt="QR Code PIX" style={{ width: 220, height: 220, margin: "18px auto", borderRadius: 12, background: "#fff", display: "block" }} />
          )}
          {pix?.pixCopiaCola ? (
            <>
              <p style={{ fontSize: 12, color: "#9a9aa2", margin: "10px 0 6px" }}>Copie o código e pague no seu banco:</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input readOnly value={pix.pixCopiaCola} style={{ ...inputStyle, marginTop: 0, fontSize: 11 }} onFocus={(e) => e.currentTarget.select()} />
                <button className="loja-btn ouro" onClick={copiarPix}>{copiado ? "Copiado!" : "Copiar"}</button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: "#9a9aa2", margin: "16px 0" }}>Gerando cobrança…</p>
          )}
          <p style={{ fontSize: 12, color: "#e9b949", marginTop: 18 }}>Aguardando confirmação do pagamento…</p>
          {erro && <p style={{ color: "#e06c75", fontSize: 13 }}>{erro}</p>}
          {/* Só aparece quando não há gateway configurado (dev/homolog). */}
          {!pix?.pixQrcode && (
            <button className="loja-btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={simularPago}>Já paguei (homolog)</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cardapio-page">
      <div className="cardapio-top">
        <h1>{cardapio.data?.operacao.nome}</h1>
        <p>Loja FEBRACIS · escolha seus itens</p>
      </div>
      {erro && <div className="cardapio-lista"><div className="fila-erro">{erro}</div></div>}
      <div className="cardapio-lista">
        {Object.entries(porCategoria).map(([cat, itens]) => (
          <div key={cat}>
            <p className="cardapio-cat">{cat}</p>
            {itens.map((p) => {
              const q = carrinho[p.produtoId] ?? 0;
              return (
                <div key={p.produtoId} className={`cardapio-item ${p.esgotado ? "esgotado" : ""}`}>
                  {p.imagemUrl ? <img src={p.imagemUrl} alt="" /> : <div style={{ width: 58, height: 58, borderRadius: 12, background: "#222" }} />}
                  <div className="info">
                    <b>{p.nome}</b>
                    {p.descricao && <p>{p.descricao}</p>}
                  </div>
                  {p.esgotado ? (
                    <span className="preco" style={{ color: "#9a9aa2" }}>Esgotado</span>
                  ) : q === 0 ? (
                    <div className="qty">
                      <span className="preco">{brl(p.preco)}</span>
                      <button className="add" onClick={() => setQty(p.produtoId, 1, p.disponivel)}>+</button>
                    </div>
                  ) : (
                    <div className="qty">
                      <button onClick={() => setQty(p.produtoId, -1, p.disponivel)}>−</button>
                      <b>{q}</b>
                      <button className="add" onClick={() => setQty(p.produtoId, 1, p.disponivel)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {qtdTotal > 0 && (
        <div className="cardapio-cart">
          <button className="btn" onClick={() => setEtapa("identificar")}>
            <span>{qtdTotal} {qtdTotal === 1 ? "item" : "itens"}</span>
            <span>Continuar · {brl(total)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", marginTop: 4, padding: "11px 12px", borderRadius: 10,
  border: "1px solid #333", background: "#1c1c22", color: "#fff", fontSize: 14,
};
