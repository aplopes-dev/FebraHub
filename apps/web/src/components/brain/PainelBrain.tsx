"use client";

/* ============ MEMÓRIA INSTITUCIONAL (GBrain) ============
   Consulta em destaque; registro e administração em modais — tela enxuta. */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Cpu, Database, FileText, Key, Loader2, PenLine, RefreshCw,
  Search, Settings2, Sparkles, Upload, X, Zap,
} from "lucide-react";
import { RespostaBrainView } from "@/components/brain/RespostaBrainView";
import { ResultadosBuscaView } from "@/components/brain/ResultadosBuscaView";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { ModalCentro } from "@/components/ui/ModalCentro";
import { BotaoPrimario } from "@/components/ui/BotaoPrimario";
import { Select } from "@/components/ui/Select";
import { BOTAO_OURO, BOTAO_SECUNDARIO, inputAv, labelAv } from "@/components/ui/estilos";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { rotuloFonte } from "@/lib/brain/fontes";
import { ACEITA, extrairTexto, type DocumentoExtraido } from "@/lib/brain/extrair-texto";
import { C, alfa } from "@/lib/tema";
import { ErroApi } from "@/services/api/client";
import {
  buscarNoBrain,
  consolidacaoBrain,
  estadoBrain,
  enviarAudioBrain,
  fontesBrain,
  perguntarAoBrain,
  registrarNoBrain,
  revalidarAcessosBrain,
  salvarConfigBrain,
  salvarConsolidacaoBrain,
  sincronizarDadosBrain,
  configBrain,
} from "@/services/api/brain";
import { MODELOS_SINTESE } from "@/types/brain";
import type { RespostaBrain, ResultadoBrain } from "@/types/brain";

type ModalAdmin = null | "motor" | "agenda" | "estado" | "registrar";

export function PainelBrain() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data ?? null;
  const podeEscrever = pode(perfil, "brain.enviar");
  const podeAdministrar = pode(perfil, "brain.gerenciar");

  const fontes = useQuery({ queryKey: ["brain-fontes"], queryFn: fontesBrain, staleTime: 5 * 60_000 });
  const estado = useQuery({
    queryKey: ["brain-estado"],
    queryFn: estadoBrain,
    enabled: podeAdministrar,
    staleTime: 60_000,
  });
  const config = useQuery({
    queryKey: ["brain-config"],
    queryFn: configBrain,
    enabled: podeAdministrar,
    staleTime: 60_000,
  });
  const consol = useQuery({
    queryKey: ["brain-consolidacao"],
    queryFn: consolidacaoBrain,
    enabled: podeAdministrar,
    staleTime: 60_000,
  });

  const [aba, setAba] = useState<"perguntar" | "buscar">("perguntar");
  const [modal, setModal] = useState<ModalAdmin>(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<RespostaBrain | null>(null);
  const [termo, setTermo] = useState("");
  const [achados, setAchados] = useState<ResultadoBrain[] | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);
  const [chave, setChave] = useState("");
  const [modelo, setModelo] = useState(MODELOS_SINTESE[0].id);
  const [horaConsol, setHoraConsol] = useState("04:05");
  const [consolAtiva, setConsolAtiva] = useState(true);
  const [fila, setFila] = useState<DocumentoExtraido[]>([]);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const falhou = (e: unknown) =>
    setAviso({
      erro: true,
      texto: e instanceof ErroApi ? e.mensagem : "A memória institucional não respondeu.",
    });

  useEffect(() => {
    if (!consol.data) return;
    setHoraConsol(consol.data.hora);
    setConsolAtiva(consol.data.ativa);
  }, [consol.data]);

  useEffect(() => {
    if (config.data?.modelo) setModelo(config.data.modelo);
  }, [config.data?.modelo]);

  const perguntar = useMutation({
    mutationFn: () => perguntarAoBrain(pergunta.trim()),
    onSuccess: (r) => { setResposta(r); setAviso(null); },
    onError: falhou,
  });

  const buscar = useMutation({
    mutationFn: () => buscarNoBrain(termo.trim()),
    onSuccess: (r) => { setAchados(r); setAviso(null); },
    onError: falhou,
  });

  const registrar = useMutation({
    mutationFn: () => registrarNoBrain(titulo.trim(), conteudo.trim()),
    onSuccess: (r) => {
      setAviso({ erro: false, texto: `Pronto — registrei em ${rotuloFonte(r.fonte)}.` });
      setTitulo("");
      setConteudo("");
      setModal(null);
    },
    onError: falhou,
  });

  const enviarFila = useMutation({
    mutationFn: async () => {
      const enviados: string[] = [];
      for (const doc of fila) {
        if (doc.ehAudio && doc.arquivo) {
          const r = await enviarAudioBrain(doc.arquivo);
          enviados.push(`${doc.origem} (áudio) → ${rotuloFonte(r.fonte)}`);
        } else {
          const r = await registrarNoBrain(doc.titulo, doc.texto, doc.origem);
          enviados.push(`${doc.origem} → ${rotuloFonte(r.fonte)}`);
        }
      }
      return enviados;
    },
    onSuccess: (enviados) => {
      setFila([]);
      setAviso({ erro: false, texto: `${enviados.length} item(ns) na memória: ${enviados.join("; ")}.` });
      setModal(null);
    },
    onError: falhou,
  });

  const sincronizar = useMutation({
    mutationFn: sincronizarDadosBrain,
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["brain-estado"] });
      void qc.invalidateQueries({ queryKey: ["brain-consolidacao"] });
      setAviso({
        erro: false,
        texto: r.publicadas
          ? `${r.publicadas} página(s) de dados publicada(s) na memória.`
          : (r.motivo ?? "Nada a publicar."),
      });
    },
    onError: falhou,
  });

  const salvarConfig = useMutation({
    mutationFn: (dados: { chaveOpenai?: string | null; modelo?: string }) => salvarConfigBrain(dados),
    onSuccess: (r) => {
      setChave("");
      void qc.invalidateQueries({ queryKey: ["brain-config"] });
      setAviso({
        erro: false,
        texto: r.temChave
          ? `Respostas pela OpenAI (${r.modelo}).`
          : "Chave removida. As respostas voltam ao modelo local da VPS.",
      });
    },
    onError: falhou,
  });

  const salvarConsol = useMutation({
    mutationFn: () => salvarConsolidacaoBrain({ ativa: consolAtiva, hora: horaConsol }),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["brain-consolidacao"] });
      setAviso({
        erro: false,
        texto: r.ativa
          ? `Consolidação diária às ${r.hora} (${r.fuso}).`
          : "Consolidação automática desligada.",
      });
      setModal(null);
    },
    onError: falhou,
  });

  const revalidar = useMutation({
    mutationFn: revalidarAcessosBrain,
    onSuccess: (r) =>
      setAviso({
        erro: false,
        texto: `${r.conferidos} credencial(is) conferida(s), ${r.ajustados} ajustada(s).`,
      }),
    onError: falhou,
  });

  const receber = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setLendo(true);
    setAviso(null);
    const lidos: DocumentoExtraido[] = [];
    for (const arquivo of Array.from(arquivos)) {
      try {
        lidos.push(await extrairTexto(arquivo));
      } catch (e) {
        setAviso({ erro: true, texto: e instanceof Error ? e.message : `Não consegui ler ${arquivo.name}.` });
      }
    }
    setFila((atual) => [...atual, ...lidos]);
    setLendo(false);
    if (entrada.current) entrada.current.value = "";
  };

  return (
    <>
      {aviso && (
        <div style={{
          marginBottom: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          border: `1px solid ${aviso.erro ? alfa("down", 0.4) : alfa("up", 0.4)}`,
          background: aviso.erro ? alfa("down", 0.09) : alfa("up", 0.09),
          color: aviso.erro ? C.down : C.up,
        }}>
          {aviso.texto}
        </div>
      )}

      {/* Faixa compacta: alcance + ações */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        marginBottom: 12, padding: "8px 10px", borderRadius: 9,
        border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.03),
      }}>
        <BookOpen size={13} style={{ color: C.gold }} />
        <span style={{ fontSize: 11.5, color: C.faint }}>Você consulta</span>
        {(fontes.data?.leitura ?? []).map((f) => (
          <span key={f} style={{
            fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
            background: alfa("gold", 0.12), color: C.gold,
          }}>
            {rotuloFonte(f)}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        {podeEscrever && (
          <button type="button" onClick={() => setModal("registrar")} style={chipAcao}>
            <PenLine size={12} /> Registrar
          </button>
        )}
        {podeAdministrar && (
          <>
            <button type="button" onClick={() => setModal("motor")} style={chipAcao} title="Motor de resposta">
              <Settings2 size={12} /> Motor
            </button>
            <button type="button" onClick={() => setModal("agenda")} style={chipAcao}>
              Agenda
            </button>
            <button type="button" onClick={() => setModal("estado")} style={chipAcao}>
              <Database size={12} /> Estado
            </button>
          </>
        )}
      </div>

      <Bloco
        titulo="Consultar a memória"
        canto={
          <div style={{ display: "flex", gap: 4 }}>
            {(["perguntar", "buscar"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                style={{
                  ...abaToggle,
                  ...(aba === id ? abaToggleAtiva : null),
                }}
              >
                {id === "perguntar" ? <Sparkles size={12} /> : <Search size={12} />}
                {id === "perguntar" ? "Perguntar" : "Buscar"}
              </button>
            ))}
          </div>
        }
      >
        {aba === "perguntar" ? (
          <>
            <textarea
              style={{ ...inputAv, minHeight: 64, resize: "vertical" as const, lineHeight: 1.5 }}
              value={pergunta}
              maxLength={600}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && pergunta.trim().length >= 5) {
                  e.preventDefault();
                  perguntar.mutate();
                }
              }}
              placeholder="Pergunte em português, como falaria numa reunião…"
            />
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <BotaoPrimario
                onClick={() => perguntar.mutate()}
                pronto={pergunta.trim().length >= 5}
                carregando={perguntar.isPending}
              >
                {!perguntar.isPending && <Sparkles size={13} />}
                {perguntar.isPending ? "Consultando…" : "Perguntar"}
              </BotaoPrimario>
            </div>
            {perguntar.isPending && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: C.faint }}>
                Lendo o que a empresa já registrou…
              </div>
            )}
            {resposta && !perguntar.isPending && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.hair}` }}>
                <RespostaBrainView resposta={resposta} />
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                style={{ ...inputAv, flex: 1, minWidth: 180 }}
                value={termo}
                maxLength={400}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && termo.trim().length >= 2) buscar.mutate();
                }}
                placeholder="Palavra-chave: desconto, matrícula, ranking…"
              />
              <BotaoPrimario
                onClick={() => buscar.mutate()}
                pronto={termo.trim().length >= 2}
                carregando={buscar.isPending}
              >
                {!buscar.isPending && <Search size={13} />}
                {buscar.isPending ? "Buscando…" : "Buscar"}
              </BotaoPrimario>
            </div>
            {achados && (
              <div style={{ marginTop: 12 }}>
                <ResultadosBuscaView achados={achados} />
              </div>
            )}
          </>
        )}
      </Bloco>

      {/* —— Modais —— */}
      {modal === "registrar" && podeEscrever && (
        <ModalCentro titulo="Registrar na memória" onFechar={() => setModal(null)} largura={560}>
          <p style={{ fontSize: 12.5, color: C.faint, margin: "0 0 12px", lineHeight: 1.5 }}>
            O conteúdo vai para{" "}
            <strong style={{ color: C.muted }}>{rotuloFonte(fontes.data?.escrita ?? "geral")}</strong>
            {" "}e passa a responder perguntas de quem alcança essa área.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastando(false); void receber(e.dataTransfer.files); }}
            onClick={() => entrada.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") entrada.current?.click(); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "16px 12px", borderRadius: 10, cursor: "pointer", textAlign: "center",
              border: `1.5px dashed ${arrastando ? C.gold : C.cardLine}`,
              background: arrastando ? alfa("gold", 0.08) : alfa("sup", 0.03),
            }}
          >
            {lendo ? <Loader2 size={16} className="girar" style={{ color: C.gold }} /> : <Upload size={16} style={{ color: C.gold }} />}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.bright }}>
              {lendo ? "Preparando…" : "Arraste PDF, texto ou áudio"}
            </div>
            <div style={{ fontSize: 11, color: C.faint }}>Áudio usa Whisper (chave OpenAI)</div>
            <input ref={entrada} type="file" accept={ACEITA} multiple
              onChange={(e) => void receber(e.target.files)} style={{ display: "none" }} />
          </div>

          {fila.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={labelAv}>Prontos para enviar</div>
              <div style={{ display: "grid", gap: 5 }}>
                {fila.map((doc, i) => (
                  <div key={`${doc.origem}-${i}`} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 9px",
                    borderRadius: 8, border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.03),
                  }}>
                    <FileText size={13} style={{ color: C.gold, flexShrink: 0 }} />
                    <span style={{ minWidth: 0, flex: 1, fontSize: 12, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.origem}{doc.ehAudio ? " · áudio" : ""}
                    </span>
                    <button type="button" onClick={() => setFila((a) => a.filter((_, j) => j !== i))}
                      aria-label="Tirar da fila" style={{ background: "none", border: "none", cursor: "pointer", color: C.dim, padding: 2 }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <BotaoPrimario onClick={() => enviarFila.mutate()} carregando={enviarFila.isPending}>
                  {!enviarFila.isPending && <Upload size={13} />}
                  Enviar {fila.length}
                </BotaoPrimario>
              </div>
            </div>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 8, margin: "16px 0 10px",
            fontSize: 10.5, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px",
          }}>
            <span style={{ flex: 1, height: 1, background: C.hair }} />
            ou escreva
            <span style={{ flex: 1, height: 1, background: C.hair }} />
          </div>

          <label style={labelAv} htmlFor="brain-titulo">Título</label>
          <input id="brain-titulo" style={inputAv} value={titulo} maxLength={160}
            onChange={(e) => setTitulo(e.target.value)} placeholder="Política de cancelamento de matrícula" />
          <label style={{ ...labelAv, marginTop: 10 }} htmlFor="brain-conteudo">Conteúdo</label>
          <textarea
            id="brain-conteudo"
            style={{ ...inputAv, minHeight: 120, resize: "vertical" as const, lineHeight: 1.5 }}
            value={conteudo}
            maxLength={20_000}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Explique o que a equipe precisa saber…"
          />
          <div style={{ marginTop: 12 }}>
            <BotaoPrimario
              onClick={() => registrar.mutate()}
              pronto={titulo.trim().length >= 3 && conteudo.trim().length >= 10}
              carregando={registrar.isPending}
            >
              {!registrar.isPending && <PenLine size={13} />} Registrar
            </BotaoPrimario>
          </div>
        </ModalCentro>
      )}

      {modal === "motor" && podeAdministrar && (
        <ModalCentro titulo="Motor de resposta" onFechar={() => setModal(null)} largura={480}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800,
            padding: "3px 9px", borderRadius: 6, marginBottom: 12,
            background: config.data?.provedor === "openai" ? alfa("up", 0.13) : alfa("warn", 0.13),
            color: config.data?.provedor === "openai" ? C.up : C.warn,
          }}>
            {config.data?.provedor === "openai" ? <Zap size={11} /> : <Cpu size={11} />}
            {config.data?.provedor === "openai" ? "OpenAI" : "Modelo local"}
          </div>
          <p style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.55, margin: "0 0 14px" }}>
            A busca nas páginas é local e gratuita. O modelo só redige a resposta em português claro.
            Com chave OpenAI a resposta sai em segundos; sem chave, usa o modelo da VPS (mais lento).
          </p>
          <label style={labelAv} htmlFor="brain-chave">
            Chave da OpenAI {config.data?.temChave && "(já gravada)"}
          </label>
          <input
            id="brain-chave" type="password" autoComplete="off" style={inputAv}
            value={chave} maxLength={200}
            onChange={(e) => setChave(e.target.value)}
            placeholder={config.data?.temChave ? "•••••••• — digite para substituir" : "sk-..."}
          />
          <label style={{ ...labelAv, marginTop: 12 }} htmlFor="brain-modelo">Modelo</label>
          <Select
            id="brain-modelo"
            style={{ width: "100%" }}
            aria-label="Modelo"
            value={modelo}
            onChange={(v) => { setModelo(v); salvarConfig.mutate({ modelo: v }); }}
            options={MODELOS_SINTESE.map((m) => ({ value: m.id, label: `${m.nome} — ${m.nota}` }))}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <BotaoPrimario
              onClick={() => salvarConfig.mutate({ chaveOpenai: chave.trim(), modelo })}
              pronto={chave.trim().length >= 20}
              carregando={salvarConfig.isPending}
            >
              {!salvarConfig.isPending && <Key size={13} />} Salvar chave
            </BotaoPrimario>
            {config.data?.temChave && (
              <BotaoPrimario
                variante="secundario"
                onClick={() => salvarConfig.mutate({ chaveOpenai: null })}
                disabled={salvarConfig.isPending}
              >
                Remover chave
              </BotaoPrimario>
            )}
          </div>
        </ModalCentro>
      )}

      {modal === "agenda" && podeAdministrar && (
        <ModalCentro titulo="Consolidação diária" onFechar={() => setModal(null)} largura={420}>
          <p style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.55, margin: "0 0 12px" }}>
            Todo dia, neste horário ({consol.data?.fuso ?? "America/Bahia"}), os indicadores do sistema
            são republicados na memória para as perguntas sobre números terem material atualizado.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
            <div>
              <label style={labelAv} htmlFor="brain-hora-consol">Horário</label>
              <input id="brain-hora-consol" type="time" style={{ ...inputAv, width: 130 }}
                value={horaConsol} onChange={(e) => setHoraConsol(e.target.value)} />
            </div>
            <label style={{
              display: "flex", alignItems: "center", gap: 7, fontSize: 12.5,
              color: C.muted, fontWeight: 700, cursor: "pointer", paddingBottom: 8,
            }}>
              <input type="checkbox" checked={consolAtiva}
                onChange={(e) => setConsolAtiva(e.target.checked)} />
              Ativa
            </label>
            <BotaoPrimario onClick={() => salvarConsol.mutate()} carregando={salvarConsol.isPending}>
              Salvar
            </BotaoPrimario>
          </div>
          {consol.data?.ultimaConsolidacaoEm && (
            <div style={{ fontSize: 11.5, color: C.dim, marginTop: 10 }}>
              Última: {new Date(consol.data.ultimaConsolidacaoEm).toLocaleString("pt-BR")}
            </div>
          )}
        </ModalCentro>
      )}

      {modal === "estado" && podeAdministrar && (
        <ModalCentro titulo="Estado da memória" onFechar={() => setModal(null)} largura={420}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <BotaoPrimario onClick={() => sincronizar.mutate()} carregando={sincronizar.isPending}>
              {!sincronizar.isPending && <RefreshCw size={13} />}
              Publicar indicadores
            </BotaoPrimario>
            <BotaoPrimario
              variante="secundario"
              onClick={() => revalidar.mutate()}
              carregando={revalidar.isPending}
            >
              Revalidar acessos
            </BotaoPrimario>
          </div>
          <Estado carregando={estado.isLoading} erro={estado.error}>
            {estado.data && !estado.data.disponivel && (
              <div style={{ fontSize: 12.5, color: C.down, lineHeight: 1.5 }}>
                Serviço fora do ar — consultas indisponíveis até o GBrain voltar.
              </div>
            )}
            {estado.data?.disponivel && (
              <div style={{ display: "grid", gap: 2 }}>
                {estado.data.fontes.map((f) => (
                  <div key={f.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 8px", borderRadius: 7,
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted }}>{rotuloFonte(f.id)}</span>
                    <span style={{ fontSize: 12, color: C.faint }}>
                      {f.paginas === null
                        ? "sem contagem"
                        : f.paginas === 0
                          ? "vazio"
                          : `${f.paginas} ${f.paginas === 1 ? "registro" : "registros"}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Estado>
        </ModalCentro>
      )}
    </>
  );
}

const chipAcao = {
  ...BOTAO_OURO,
  padding: "5px 12px",
  fontSize: 11.5,
  gap: 5,
} as const;

const abaToggle = {
  ...BOTAO_SECUNDARIO,
  padding: "5px 11px",
  fontSize: 11.5,
  gap: 5,
} as const;

const abaToggleAtiva = {
  ...BOTAO_OURO,
  padding: "5px 11px",
  fontSize: 11.5,
  gap: 5,
} as const;
