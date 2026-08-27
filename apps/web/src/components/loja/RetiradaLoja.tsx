"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, ScanLine, CheckCircle2, XCircle, ChefHat, RotateCcw, Keyboard, Printer, Loader2 } from "lucide-react";
import { consultarRetirada, prepararPorTokenQr } from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { LeitorQr } from "@/components/loja/LeitorQr";
import "@/app/loja.css";
import "@/app/retirada.css";

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Extrai o token de um texto lido: aceita a URL completa
 *  (…/loja/retirada/<token>), a querystring, ou o token puro. */
function extrairToken(bruto: string): string {
  const t = bruto.trim();
  const m = t.match(/\/loja\/retirada\/([^/?#\s]+)/);
  if (m) return decodeURIComponent(m[1]);
  try {
    const u = new URL(t);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length) return decodeURIComponent(parts[parts.length - 1]);
  } catch {
    /* não é URL — trata como token puro */
  }
  return t;
}

export function RetiradaLoja({ tokenInicial }: { tokenInicial?: string }) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(tokenInicial ?? null);
  const [modo, setModo] = useState<"scan" | "manual">(tokenInicial ? "manual" : "scan");
  const [manual, setManual] = useState("");
  const [erroCamera, setErroCamera] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // evita disparar o preparar/impressão duas vezes para o mesmo token
  const jaPreparou = useRef<string | null>(null);

  const consulta = useQuery({
    queryKey: ["retirada", token],
    queryFn: () => consultarRetirada(token!),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const preparar = useMutation({
    mutationFn: () => prepararPorTokenQr(token!),
    onSuccess: () => {
      setErro(null);
      qc.invalidateQueries({ queryKey: ["retirada", token] });
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao preparar / imprimir o pedido."),
  });

  const aoLer = useCallback((bruto: string) => {
    setErro(null);
    jaPreparou.current = null;
    setToken(extrairToken(bruto));
  }, []);

  // Ao confirmar que o pedido é válido/pago, PREPARA automaticamente (e imprime).
  const c = consulta.data;
  useEffect(() => {
    if (!token || !c) return;
    // podeRetirar = pago, confirmado e não retirado → pode ir para preparação
    if (c.podeRetirar && jaPreparou.current !== token && !preparar.isPending) {
      jaPreparou.current = token;
      preparar.mutate();
    }
  }, [token, c, preparar]);

  function reiniciar() {
    setErro(null);
    preparar.reset();
    jaPreparou.current = null;
    setToken(null);
    setManual("");
    setModo("scan");
    setErroCamera(null);
  }

  function buscarManual() {
    const t = extrairToken(manual);
    if (!t) return;
    setErro(null);
    jaPreparou.current = null;
    setToken(t);
  }

  useEffect(() => {
    if (erroCamera) setModo("manual");
  }, [erroCamera]);

  const preparado = preparar.isSuccess;

  return (
    <div className="ret-page">
      <header className="ret-hero">
        <div>
          <span className="tag">LOJA · PREPARAR</span>
          <h1>Preparar por QR</h1>
          <p>Escaneie o comprovante do cliente para enviar à preparação e imprimir o cupom.</p>
        </div>
        {token && (
          <button className="loja-btn" onClick={reiniciar}><RotateCcw /> Nova leitura</button>
        )}
      </header>

      {/* ---------- LEITURA (sem token ainda) ---------- */}
      {!token && (
        <section className="ret-leitura">
          <div className="ret-tabs">
            <button className={modo === "scan" ? "on" : ""} onClick={() => setModo("scan")}>
              <ScanLine /> Escanear
            </button>
            <button className={modo === "manual" ? "on" : ""} onClick={() => setModo("manual")}>
              <Keyboard /> Digitar código
            </button>
          </div>

          {modo === "scan" && (
            <>
              <LeitorQr onLer={aoLer} onErro={setErroCamera} />
              {erroCamera && (
                <p className="ret-aviso">
                  Câmera indisponível ({erroCamera}). Use “Digitar código” abaixo.
                </p>
              )}
            </>
          )}

          {modo === "manual" && (
            <div className="ret-manual">
              <label>Cole o link do QR ou o código do comprovante</label>
              <div className="ret-manual-linha">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarManual()}
                  placeholder="ex.: https://…/loja/retirada/XXXX ou o código"
                  autoFocus
                />
                <button className="loja-btn ouro" onClick={buscarManual} disabled={!manual.trim()}>
                  <QrCode /> Verificar
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---------- VERIFICAÇÃO / RESULTADO ---------- */}
      {token && consulta.isLoading && <div className="ret-card"><p className="ret-carregando">Verificando comprovante…</p></div>}

      {token && consulta.isError && (
        <div className="ret-card ret-negado">
          <XCircle className="ret-ico" />
          <h2>Comprovante inválido</h2>
          <p>Este QR não corresponde a nenhum pedido. Confira e tente de novo.</p>
          <button className="loja-btn" onClick={reiniciar}><RotateCcw /> Escanear outro</button>
        </div>
      )}

      {token && c && (
        <div className={`ret-card ${preparado ? "ret-ok" : c.podeRetirar ? "ret-pronto" : "ret-negado"}`}>
          <div className="ret-card-topo">
            <div className={`ret-status-ico ${preparado ? "ok" : c.podeRetirar ? "pronto" : "negado"}`}>
              {preparar.isPending ? <Loader2 className="ret-spin" /> : preparado ? <ChefHat /> : c.podeRetirar ? <CheckCircle2 /> : <XCircle />}
            </div>
            <div>
              <span className="ret-num">#{c.numero}</span>
              <h2>
                {preparar.isPending ? "Enviando à preparação…" : preparado ? "Em preparação — cupom impresso" : c.podeRetirar ? "Pagamento confirmado" : "Não pode preparar"}
              </h2>
              <p className="ret-op">{c.operacao} · {c.clienteNome}</p>
            </div>
          </div>

          {/* Badges rápidos */}
          <div className="ret-flags">
            <span className={`ret-flag ${c.pago ? "sim" : "nao"}`}>{c.pago ? "✔ Pago" : "✗ Não pago"}</span>
            {c.formaPagamento && <span className="ret-flag neutro">{c.formaPagamento}</span>}
            {c.cancelado && <span className="ret-flag nao">Cancelado</span>}
          </div>

          {/* Bloqueio (motivo legível) */}
          {!c.podeRetirar && !preparado && c.bloqueio && (
            <p className="ret-bloqueio">{c.bloqueio}</p>
          )}

          {/* Itens da compra */}
          <ul className="ret-itens">
            {c.itens.map((it) => (
              <li key={it.id}>
                <span className="q">{Number(it.quantidade)}×</span>
                <span className="d">{it.descricao}</span>
                <span className="v">{brl(it.total)}</span>
              </li>
            ))}
          </ul>
          <div className="ret-total"><span>Total</span><b>{brl(c.total)}</b></div>

          {erro && <p className="ret-erro">{erro}</p>}

          {/* Ações */}
          {preparado ? (
            <button className="loja-btn" onClick={reiniciar}><ScanLine /> Escanear próximo</button>
          ) : c.podeRetirar ? (
            <button className="ret-confirmar" onClick={() => preparar.mutate()} disabled={preparar.isPending}>
              <Printer /> {preparar.isPending ? "Preparando…" : "Preparar e imprimir"}
            </button>
          ) : (
            <button className="loja-btn" onClick={reiniciar}><RotateCcw /> Escanear outro</button>
          )}
        </div>
      )}
    </div>
  );
}
