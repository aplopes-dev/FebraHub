"use client";

/* Áudio das conversas: gravação pelo MediaRecorder nativo (sem dependência —
   Chrome/Edge/Firefox gravam webm/opus, Safari grava mp4/aac) e player com
   waveform desenhada em canvas via WebAudio. A origem não tinha waveform
   (player era um slider); aqui ela entra porque a spec pede — e o custo é um
   decode local, nada de biblioteca. */

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, X } from "lucide-react";
import { C, alfa } from "@/lib/tema";

const GRAVACAO_MAX_S = 5 * 60;

function formatoTempo(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function tipoSuportado(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

export function BotaoGravarAudio({
  onGravado,
  desabilitado,
}: {
  onGravado: (arquivo: File) => void;
  desabilitado?: boolean;
}) {
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const gravadorRef = useRef<MediaRecorder | null>(null);
  const pedacosRef = useRef<Blob[]>([]);
  const descartarRef = useRef(false);
  const relogioRef = useRef<number | null>(null);

  const pararTudo = useCallback(() => {
    if (relogioRef.current) window.clearInterval(relogioRef.current);
    relogioRef.current = null;
    gravadorRef.current?.stream.getTracks().forEach((t) => t.stop());
    gravadorRef.current = null;
    setGravando(false);
    setSegundos(0);
  }, []);

  useEffect(() => () => {
    descartarRef.current = true;
    if (gravadorRef.current?.state === "recording") gravadorRef.current.stop();
    pararTudo();
  }, [pararTudo]);

  const comecar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = tipoSuportado();
      const gravador = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      pedacosRef.current = [];
      descartarRef.current = false;
      gravador.ondataavailable = (e) => {
        if (e.data.size) pedacosRef.current.push(e.data);
      };
      gravador.onstop = () => {
        const cancelado = descartarRef.current;
        const mime = gravador.mimeType || "audio/webm";
        pararTudo();
        if (cancelado || !pedacosRef.current.length) return;
        const extensao = mime.includes("mp4") ? "m4a" : "webm";
        const blob = new Blob(pedacosRef.current, { type: mime });
        onGravado(new File([blob], `voz-${Date.now()}.${extensao}`, { type: mime }));
      };
      gravador.start(250);
      gravadorRef.current = gravador;
      setGravando(true);
      setSegundos(0);
      relogioRef.current = window.setInterval(() => {
        setSegundos((s) => {
          if (s + 1 >= GRAVACAO_MAX_S && gravadorRef.current?.state === "recording") {
            gravadorRef.current.stop();
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      // Sem microfone ou permissão negada: o botão simplesmente não grava.
    }
  };

  const parar = () => {
    if (gravadorRef.current?.state === "recording") gravadorRef.current.stop();
  };
  const cancelar = () => {
    descartarRef.current = true;
    parar();
  };

  if (gravando) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden style={{
          width: 8, height: 8, borderRadius: "50%", background: C.down,
          animation: "fh-pulso 1s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 11.5, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
          {formatoTempo(segundos)} / {formatoTempo(GRAVACAO_MAX_S)}
        </span>
        <button type="button" onClick={cancelar} title="Cancelar gravação" aria-label="Cancelar gravação"
          className="fh-toque" style={botaoIcone()}>
          <X size={15} />
        </button>
        <button type="button" onClick={parar} title="Parar e anexar" aria-label="Parar e anexar o áudio"
          className="fh-toque" style={{ ...botaoIcone(), color: C.down }}>
          <Square size={14} />
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={comecar} disabled={desabilitado}
      title="Gravar áudio" aria-label="Gravar áudio" className="fh-toque" style={botaoIcone(desabilitado)}>
      <Mic size={16} />
    </button>
  );
}

const botaoIcone = (desabilitado?: boolean) => ({
  background: "none", border: "none", cursor: desabilitado ? "default" : "pointer",
  color: desabilitado ? C.dim : C.faint, display: "inline-flex", padding: 4,
  opacity: desabilitado ? 0.5 : 1,
} as const);

/* ------------------------------- player ------------------------------- */

const BARRAS = 44;

export function PlayerAudio({ src, notaVoz }: { src: string; notaVoz?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tocando, setTocando] = useState(false);
  const [duracao, setDuracao] = useState(0);
  const [posicao, setPosicao] = useState(0);
  const [picos, setPicos] = useState<number[] | null>(null);

  // Decodifica o áudio uma vez para desenhar a forma de onda. Se o decode
  // falhar (formato exótico), o player continua funcionando sem waveform.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const resposta = await fetch(src, { credentials: "include" });
        if (!resposta.ok) return;
        const bruto = await resposta.arrayBuffer();
        const ctx = new AudioContext();
        const buffer = await ctx.decodeAudioData(bruto);
        void ctx.close();
        if (!vivo) return;
        const canal = buffer.getChannelData(0);
        const passo = Math.max(1, Math.floor(canal.length / BARRAS));
        const lista: number[] = [];
        for (let i = 0; i < BARRAS; i++) {
          let pico = 0;
          const inicio = i * passo;
          for (let j = inicio; j < Math.min(inicio + passo, canal.length); j += 32) {
            const v = Math.abs(canal[j]);
            if (v > pico) pico = v;
          }
          lista.push(pico);
        }
        const maior = Math.max(...lista, 0.01);
        setPicos(lista.map((p) => p / maior));
        setDuracao(buffer.duration);
      } catch { /* sem waveform */ }
    })();
    return () => { vivo = false; };
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const fracao = duracao > 0 ? posicao / duracao : 0;
    const larguraBarra = w / BARRAS;
    for (let i = 0; i < BARRAS; i++) {
      const altura = Math.max(2, ((picos?.[i] ?? 0.35)) * (h - 4));
      ctx.fillStyle = i / BARRAS <= fracao ? C.gold : alfa("sup", 0.25);
      ctx.beginPath();
      ctx.roundRect(i * larguraBarra + 1, (h - altura) / 2, Math.max(1.5, larguraBarra - 2.5), altura, 2);
      ctx.fill();
    }
  }, [picos, posicao, duracao]);

  const alternar = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const buscar = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || !duracao) return;
    const caixa = canvas.getBoundingClientRect();
    audio.currentTime = ((e.clientX - caixa.left) / caixa.width) * duracao;
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 200 }}>
      {notaVoz && <Mic size={13} style={{ color: C.faint, flexShrink: 0 }} aria-hidden />}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => { setTocando(false); setPosicao(0); }}
        onTimeUpdate={(e) => setPosicao(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuracao(d);
        }}
        hidden
      />
      <button type="button" onClick={alternar} className="fh-toque"
        aria-label={tocando ? "Pausar áudio" : "Reproduzir áudio"} style={botaoIcone()}>
        {tocando ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <canvas
        ref={canvasRef}
        onClick={buscar}
        role="slider"
        aria-label="Posição do áudio"
        aria-valuemin={0}
        aria-valuemax={Math.round(duracao)}
        aria-valuenow={Math.round(posicao)}
        style={{ width: 130, height: 26, cursor: "pointer", flexShrink: 0 }}
      />
      <span style={{ fontSize: 10.5, color: C.faint, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        {formatoTempo(posicao)} / {duracao ? formatoTempo(duracao) : "–:––"}
      </span>
    </span>
  );
}
