"use client";
import { useState } from "react";
import { Check, Copy, Download, Link2, Printer, Share2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { qrcodeCardapio } from "@/services/api/loja-pedidos";
import "@/app/loja.css";

/** QR Code do cardápio de uma operação (PRD §11) — para COMPARTILHAR com o
 *  cliente: copiar link, compartilhar nativo (WhatsApp/etc.), baixar PNG/SVG e
 *  imprimir. O QR aponta para a URL pública do cardápio da operação. */
export function QrCardapioModal({ slug, nome, aoFechar }: { slug: string; nome: string; aoFechar: () => void }) {
  const qr = useQuery({ queryKey: ["loja-qr", slug], queryFn: () => qrcodeCardapio(slug) });
  const d = qr.data;
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (!d) return;
    try {
      await navigator.clipboard.writeText(d.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* sem clipboard */ }
  };

  const mensagem = (url: string) => [
    `🍽️ *Cardápio Digital — ${nome}*`,
    "",
    "Faça seu pedido online, sem fila e sem complicação! 👇",
    url,
    "",
    "✅ Pague por *PIX* ou *cartão*",
    "📱 Acompanhe o preparo pelo celular",
    "⏱️ É só retirar no balcão quando estiver pronto",
  ].join("\n");

  const podeCompartilhar = typeof navigator !== "undefined" && !!navigator.share;
  const compartilhar = async () => {
    if (!d) return;
    try {
      await navigator.share({ title: `Cardápio · ${nome}`, text: mensagem(d.url) });
    } catch { /* usuário cancelou ou sem suporte */ }
  };

  const whatsapp = () => {
    if (!d) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem(d.url))}`, "_blank", "noopener");
  };

  const baixar = (conteudo: string, ext: string) => {
    const a = document.createElement("a");
    a.href = ext === "svg" ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(conteudo)}` : conteudo;
    a.download = `cardapio-${slug}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const imprimir = () => {
    if (!d) return;
    const w = window.open("", "_blank", "width=680,height=820");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Cardápio · ${nome}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:48px;color:#111}
      h1{font-size:26px;margin:0 0 6px} p{color:#555;margin:0 0 28px;font-size:15px}
      img{width:420px;height:420px} .url{margin-top:20px;font-size:13px;color:#333;word-break:break-all}</style></head>
      <body><h1>${nome}</h1><p>Aponte a câmera e faça seu pedido</p>
      <img src="${d.pngDataUrl}" alt="QR Code do cardápio"/><div class="url">${d.url}</div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300)}</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal" style={{ maxWidth: 440, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Compartilhar cardápio</h3>
          <button className="loja-btn mini" onClick={aoFechar}><X size={14} /></button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 16px" }}>{nome}</p>

        {qr.isLoading && <p className="loja-empty">Gerando QR…</p>}
        {qr.isError && <p className="loja-empty" style={{ color: "var(--down)" }}>Falha ao gerar. Verifique se a operação tem slug e a URL pública está configurada.</p>}
        {d && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.pngDataUrl} alt="QR Code do cardápio" width={240} height={240} style={{ borderRadius: 12, background: "#fff", padding: 10 }} />

            {/* Link + copiar (destaque) */}
            <div className="qrc-linkbox">
              <Link2 size={14} />
              <span className="qrc-url">{d.url}</span>
            </div>

            {/* Ações de compartilhamento */}
            <div className="qrc-acoes">
              <button className="loja-btn ouro" onClick={copiar}>
                {copiado ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar link</>}
              </button>
              {podeCompartilhar && (
                <button className="loja-btn" onClick={compartilhar}><Share2 size={15} /> Compartilhar</button>
              )}
              <button className="loja-btn" onClick={whatsapp} title="Compartilhar via WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2Zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.16 8.16 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.23 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>
                WhatsApp
              </button>
            </div>

            {/* Baixar / imprimir para banner/mesa */}
            <div className="qrc-secundario">
              <button className="loja-btn mini" onClick={() => baixar(d.pngDataUrl, "png")}><Download size={13} /> PNG</button>
              <button className="loja-btn mini" onClick={() => baixar(d.svg, "svg")}><Download size={13} /> SVG</button>
              <button className="loja-btn mini" onClick={imprimir}><Printer size={13} /> Imprimir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
