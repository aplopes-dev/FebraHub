"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Banner de "Instalar app" (PWA). Aparece só quando o browser dispara
 *  `beforeinstallprompt` (Android/desktop Chrome) e o usuário ainda não
 *  instalou. Em iOS não há evento — mostramos uma dica de "Adicionar à Tela de
 *  Início". Guarda a dispensa em localStorage para não insistir.
 *
 *  `rotulo` personaliza o texto (padrão: instalar o FebraHub inteiro). Ex.: o
 *  balcão passa "PDV no aparelho". `className` troca o visual: no balcão usa o
 *  tema do PDV (.pm-install); no Shell do ERP usa .fh-pwa-install. */
export function PromptInstalar({
  rotulo = "o FebraHub no aparelho",
  className = "pm-install",
}: { rotulo?: string; className?: string } = {}) {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [iosDica, setIosDica] = useState(false);
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("febrahub:pwa-dispensado") === "1") return;
    // Já instalado (standalone)? Não mostra.
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as PromptEvent);
      setOculto(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari não tem beforeinstallprompt → dica manual.
    const ua = window.navigator.userAgent;
    const ehIOS = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
    if (ehIOS) { setIosDica(true); setOculto(false); }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dispensar = () => {
    setOculto(true);
    localStorage.setItem("febrahub:pwa-dispensado", "1");
  };

  const instalar = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice.catch(() => undefined);
    setEvt(null);
    setOculto(true);
  };

  if (oculto) return null;

  return (
    <div className={className}>
      <Download size={17} />
      {iosDica ? (
        <span>Instale: toque em Compartilhar → “Adicionar à Tela de Início”.</span>
      ) : (
        <>
          <span>Instalar {rotulo}</span>
          <button onClick={instalar}>Instalar</button>
        </>
      )}
      <button className="x" onClick={dispensar} aria-label="Dispensar"><X size={16} /></button>
    </div>
  );
}
