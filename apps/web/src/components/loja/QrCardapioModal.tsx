"use client";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, Printer, X } from "lucide-react";
import { qrcodeCardapio } from "@/services/api/loja-pedidos";
import "@/app/loja.css";

/** QR Code do cardápio de uma operação (PRD §11) — preview + baixar PNG/SVG +
 *  imprimir. O QR aponta para a URL pública do cardápio da operação. */
export function QrCardapioModal({ slug, nome, aoFechar }: { slug: string; nome: string; aoFechar: () => void }) {
  const qr = useQuery({ queryKey: ["loja-qr", slug], queryFn: () => qrcodeCardapio(slug) });
  const d = qr.data;

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
      <div className="loja-modal" style={{ maxWidth: 420, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>QR do cardápio</h3>
          <button className="loja-btn mini" onClick={aoFechar}><X size={14} /></button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 16px" }}>{nome}</p>

        {qr.isLoading && <p className="loja-empty">Gerando QR…</p>}
        {qr.isError && <p className="loja-empty" style={{ color: "var(--down)" }}>Falha ao gerar. Verifique se a operação tem slug e a URL pública está configurada.</p>}
        {d && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.pngDataUrl} alt="QR Code do cardápio" width={240} height={240} style={{ borderRadius: 12, background: "#fff", padding: 10 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", margin: "12px 0", fontSize: 12, color: "var(--muted)" }}>
              <span style={{ wordBreak: "break-all" }}>{d.url}</span>
              <button className="loja-btn mini" title="Copiar link" onClick={() => navigator.clipboard?.writeText(d.url)}><Copy size={13} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="loja-btn mini" onClick={() => baixar(d.pngDataUrl, "png")}><Download size={13} /> PNG</button>
              <button className="loja-btn mini" onClick={() => baixar(d.svg, "svg")}><Download size={13} /> SVG</button>
              <button className="loja-btn ouro mini" onClick={imprimir}><Printer size={13} /> Imprimir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
