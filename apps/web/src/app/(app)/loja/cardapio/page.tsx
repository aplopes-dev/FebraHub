"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, QrCode, Store } from "lucide-react";
import Link from "next/link";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { lojaOperacaoAtiva, qrcodeCardapio } from "@/services/api/loja-pedidos";
import { QrCardapioModal } from "@/components/loja/QrCardapioModal";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import "@/app/loja.css";
import "@/app/fila.css";

/** Monta a mensagem "bonita" de divulgação do cardápio para o WhatsApp. */
function mensagemWhatsapp(nome: string, url: string) {
  return [
    `🍽️ *Cardápio Digital — ${nome}*`,
    "",
    "Faça seu pedido online, sem fila e sem complicação! 👇",
    url,
    "",
    "✅ Pague por *PIX* ou *cartão*",
    "📱 Acompanhe o preparo pelo celular",
    "⏱️ É só retirar no balcão quando estiver pronto",
  ].join("\n");
}

function CardapioHub() {
  const op = useQuery({ queryKey: ["loja-operacao-ativa"], queryFn: () => lojaOperacaoAtiva() });
  const slug = op.data?.slug ?? null;
  const nome = op.data?.nome ?? "Loja FEBRACIS";

  const qr = useQuery({ queryKey: ["loja-qr", slug], queryFn: () => qrcodeCardapio(slug as string), enabled: !!slug });
  const url = qr.data?.url ?? (slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/cardapio/${slug}` : "");

  const [copiado, setCopiado] = useState(false);
  const [qrAberto, setQrAberto] = useState(false);

  const copiar = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sem clipboard */ }
  };

  const compartilharWhatsapp = () => {
    if (!url) return;
    const texto = encodeURIComponent(mensagemWhatsapp(nome, url));
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener");
  };

  if (op.isLoading) return <TelaCarregando />;

  return (
    <div className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">LOJA · CARDÁPIO</span>
          <h1>Cardápio digital</h1>
          <p>Abra, teste e compartilhe o cardápio público da operação ativa.</p>
        </div>
        <Store style={{ width: 30, color: "var(--gold)" }} />
      </header>

      {!op.data && (
        <div className="loja-card">
          <div className="fila-erro" style={{ marginBottom: 12 }}>
            Nenhuma operação ativa. O cardápio público é sempre de uma operação.
          </div>
          <Link className="loja-btn ouro" href="/loja/operacoes">Criar / ativar uma operação</Link>
        </div>
      )}
      {op.data && !slug && (
        <div className="loja-card">
          <div className="fila-erro" style={{ marginBottom: 12 }}>
            A operação ativa <b>{op.data.nome}</b> não tem slug — necessário para a URL pública.
          </div>
          <Link className="loja-btn ouro" href="/loja/operacoes">Definir o slug em Operações</Link>
        </div>
      )}

      {slug && (
        <div className="loja-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800 }}>Cardápio de {nome}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", wordBreak: "break-all" }}>{url || "…"}</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="loja-btn ouro" onClick={compartilharWhatsapp} disabled={!url}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2Zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.16 8.16 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.23 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>
              Compartilhar no WhatsApp
            </button>
            <button className="loja-btn" onClick={copiar} disabled={!url}>
              {copiado ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar link</>}
            </button>
            <button className="loja-btn" onClick={() => setQrAberto(true)}>
              <QrCode size={15} /> QR Code
            </button>
            <a className="loja-btn" href={`/cardapio/${slug}`} target="_blank" rel="noreferrer">
              <ExternalLink size={15} /> Abrir cardápio
            </a>
          </div>

          <div style={{ background: "var(--void, rgba(0,0,0,.03))", border: "1px solid var(--card-line)", borderRadius: 12, padding: "12px 14px" }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--muted)" }}>
              Prévia da mensagem
            </p>
            <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {mensagemWhatsapp(nome, url || `…/cardapio/${slug}`)}
            </pre>
          </div>
        </div>
      )}

      {qrAberto && slug && (
        <QrCardapioModal slug={slug} nome={nome} aoFechar={() => setQrAberto(false)} />
      )}
    </div>
  );
}

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <CardapioHub />
    </GuardaPermissao>
  );
}
