"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Leitor de QR pela câmera. Carrega o html5-qrcode por import() dinâmico (só
 * baixa/roda no cliente, quando a tela do vendedor abre — nunca no SSR). Chama
 * `onLer(texto)` na primeira leitura válida e para o scanner. `pausado` desliga
 * a câmera (ex.: enquanto mostra o resultado). Se a câmera falhar/negar, expõe
 * o erro para a UI oferecer o modo manual.
 */
export function LeitorQr({
  onLer,
  onErro,
  pausado = false,
}: {
  onLer: (texto: string) => void;
  onErro?: (msg: string) => void;
  pausado?: boolean;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  // Guarda a instância do Html5Qrcode (tipo solto: o pacote não tem SSR types aqui).
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lidoRef = useRef(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    if (pausado) return;

    (async () => {
      try {
        const mod = await import("html5-qrcode");
        if (cancelado || !divRef.current) return;
        const Html5Qrcode = mod.Html5Qrcode;
        const id = "leitor-qr-regiao";
        divRef.current.id = id;
        const scanner = new Html5Qrcode(id, { verbose: false });
        scannerRef.current = scanner as unknown as { stop: () => Promise<void>; clear: () => void };

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (texto: string) => {
            if (lidoRef.current) return;
            lidoRef.current = true;
            onLer(texto);
          },
          () => {
            /* leitura sem QR no frame — ignora silenciosamente */
          },
        );
        if (!cancelado) setPronto(true);
      } catch (e) {
        onErro?.(e instanceof Error ? e.message : "Não foi possível acessar a câmera.");
      }
    })();

    return () => {
      cancelado = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => undefined);
        scannerRef.current = null;
      }
      lidoRef.current = false;
    };
  }, [pausado, onLer, onErro]);

  if (pausado) return null;

  return (
    <div className="ret-scanner">
      <div ref={divRef} className="ret-scanner-video" />
      {!pronto && <p className="ret-scanner-hint">Abrindo a câmera…</p>}
      {pronto && <p className="ret-scanner-hint">Aponte para o QR do comprovante do cliente</p>}
    </div>
  );
}
