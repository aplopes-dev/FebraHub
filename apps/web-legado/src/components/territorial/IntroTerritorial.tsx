"use client";

/* Abertura cinematográfica do hub (Higgsfield/Seedance — o MESMO vídeo do
   hub.aplopes.com, copiado para /public/intro), EMBUTIDA na moldura do mapa:
   toca sobre a área do mapa enquanto os dados carregam por trás (mascara a
   primeira carga), em vez de cobrir o app inteiro. Regras do porte intactas:
   - prefers-reduced-motion → não toca sozinha; entra direto no mapa;
   - visita repetida (localStorage) → pula sozinha;
   - vídeo indisponível/erro → registra e libera a interface;
   - "Pular animação" sempre à mão (Esc também);
   - no fim, crossfade para o mapa que JÁ está montado atrás.
   `pedidoReplay` (carimbo incremental vindo do botão nos controles do mapa)
   reabre a qualquer momento — replay é gesto explícito, então toca mesmo
   com reduced-motion e mesmo já tendo sido vista. */

import { useCallback, useEffect, useRef, useState } from "react";
import { SkipForward } from "lucide-react";
import { INTRO_VISTA_CHAVE } from "@/lib/territorial/introChave";

const VIDEO_SRC = "/intro/opening-1080.mp4";
const POSTER_SRC = "/intro/poster.jpg";

type Fase = "pendente" | "tocando" | "feita";

export function IntroTerritorial({ pedidoReplay = 0 }: { pedidoReplay?: number }) {
  const [fase, setFase] = useState<Fase>("pendente");
  const [esmaecendo, setEsmaecendo] = useState(false);
  const [mostrarPular, setMostrarPular] = useState(false);
  const [precisaGesto, setPrecisaGesto] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const terminouRef = useRef(false);

  const encerrar = useCallback((motivo: "fim" | "pular" | "erro" | "movimento-reduzido" | "vista") => {
    if (terminouRef.current) return;
    terminouRef.current = true;
    if (motivo === "erro") {
      console.warn("[intro] vídeo de abertura indisponível — abrindo o mapa diretamente");
    }
    try { localStorage.setItem(INTRO_VISTA_CHAVE, "1"); } catch { /* sem storage */ }
    if (motivo === "movimento-reduzido" || motivo === "vista" || motivo === "erro") {
      setFase("feita");
      return;
    }
    setEsmaecendo(true);
    window.setTimeout(() => setFase("feita"), 850);
  }, []);

  // Decisão inicial: tocar, pular por preferência ou por visita repetida.
  useEffect(() => {
    if (fase !== "pendente") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      encerrar("movimento-reduzido");
      return;
    }
    let vista = false;
    try { vista = localStorage.getItem(INTRO_VISTA_CHAVE) === "1"; } catch { /* ignora */ }
    if (vista) {
      encerrar("vista");
      return;
    }
    setFase("tocando");
  }, [fase, encerrar]);

  // Replay pelo botão do mapa: reabre do zero, ignorando "já vista".
  useEffect(() => {
    if (pedidoReplay <= 0) return;
    terminouRef.current = false;
    setPrecisaGesto(false);
    setMostrarPular(false);
    setEsmaecendo(false);
    setFase("tocando");
  }, [pedidoReplay]);

  useEffect(() => {
    if (fase !== "tocando") return;
    terminouRef.current = false;
    setEsmaecendo(false);
    const t = window.setTimeout(() => setMostrarPular(true), 700);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      // Autoplay bloqueado ≠ vídeo indisponível: oferece reprodução manual.
      const p = v.play();
      if (p) p.catch(() => setPrecisaGesto(true));
    }
    const aoTecla = (e: KeyboardEvent) => { if (e.key === "Escape") encerrar("pular"); };
    window.addEventListener("keydown", aoTecla);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", aoTecla);
    };
  }, [fase, encerrar]);

  if (fase !== "tocando") return null;

  return (
    <div
      role="presentation"
      aria-label="Animação de abertura"
      style={{
        // Absoluto DENTRO da moldura do mapa (relative, overflow hidden):
        // cobre só a área do mapa; z-index 40 fica acima do véu de
        // carregamento (30) e dos controles (20).
        position: "absolute", inset: 0, zIndex: 40, background: "#050b18",
        borderRadius: "inherit", overflow: "hidden",
        transition: "opacity .7s ease-out",
        opacity: esmaecendo ? 0 : 1,
        pointerEvents: esmaecendo ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        poster={POSTER_SRC}
        muted
        autoPlay
        playsInline
        preload="auto"
        onEnded={() => encerrar("fim")}
        onError={() => encerrar("erro")}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(3,7,17,0.75) 100%)",
      }} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: "8%", pointerEvents: "none",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "0 24px", textAlign: "center",
      }}>
        <span style={{
          borderRadius: 999, border: "1px solid rgba(125,165,255,0.25)",
          background: "rgba(11,21,38,0.5)", padding: "4px 12px", fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.28em", color: "#8fa3c8",
          backdropFilter: "blur(6px)",
        }}>
          Inteligência de mercado
        </span>
        <h1 style={{
          margin: 0, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 600, color: "#e8effc",
          textShadow: "0 2px 18px rgba(56,189,248,0.35)", letterSpacing: "-0.02em",
        }}>
          Inteligência Territorial de Empresas
        </h1>
        <p style={{ margin: 0, maxWidth: 440, fontSize: 13, color: "#8fa3c8" }}>
          Bahia · Sergipe · Alagoas · Pernambuco
        </p>
      </div>
      {precisaGesto && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "grid", placeItems: "center" }}>
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return encerrar("erro");
              v.play().then(() => setPrecisaGesto(false)).catch(() => encerrar("erro"));
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999,
              padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              color: "#e8effc", background: "rgba(18,32,57,0.9)",
              border: "1px solid rgba(125,165,255,0.28)", backdropFilter: "blur(12px)",
            }}
          >
            ▶ Reproduzir abertura
          </button>
        </div>
      )}
      {mostrarPular && (
        <button
          type="button"
          onClick={() => encerrar("pular")}
          style={{
            position: "absolute", bottom: 24, right: 24, zIndex: 10,
            display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: "#e8effc", background: "rgba(16,29,51,0.72)",
            border: "1px solid rgba(125,165,255,0.2)", backdropFilter: "blur(10px)",
          }}
        >
          Pular animação
          <SkipForward size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}
