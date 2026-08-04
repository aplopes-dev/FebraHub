"use client";

/* ============ MEMÓRIA INSTITUCIONAL (GBrain) ============
   Três blocos: perguntar (resposta sintetizada com citações), buscar
   (páginas cruas, ranqueadas) e registrar (grava na fonte do próprio setor).

   O recorte de acesso não é decidido aqui. Cada pessoa tem uma credencial
   própria no gbrain, com as fontes dos setores dela — a tela só MOSTRA quais
   são, para ninguém achar que a memória está vazia quando na verdade a
   pergunta caiu num setor que ela não alcança. */

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Cpu, Database, FileText, Key, Loader2, PenLine, RefreshCw, Search, Sparkles, Upload, X, Zap } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { PINTURA_OURO, inputAv, labelAv } from "@/components/ui/estilos";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import {
  buscarNoBrain,
  estadoBrain,
  fontesBrain,
  perguntarAoBrain,
  registrarNoBrain,
  revalidarAcessosBrain,
  salvarConfigBrain,
  sincronizarDadosBrain,
  configBrain,
} from "@/services/api/brain";
import { ACEITA, extrairTexto, type DocumentoExtraido } from "@/lib/brain/extrair-texto";
import { C, SANS, alfa } from "@/lib/tema";
import { MODELOS_SINTESE } from "@/types/brain";
import type { RespostaBrain, ResultadoBrain } from "@/types/brain";

const NOME_FONTE: Record<string, string> = {
  geral: "Geral",
  comercial: "Comercial",
  financeiro: "Financeiro",
  marketing: "Marketing",
  pedagogico: "Pedagógico",
  eventos: "Eventos",
  loja: "Loja",
  estoque: "Estoque",
  crm: "CRM",
};

const rotulo = (f: string) => NOME_FONTE[f] ?? f;

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

  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<RespostaBrain | null>(null);
  const [termo, setTermo] = useState("");
  const [achados, setAchados] = useState<ResultadoBrain[] | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);
  const [chave, setChave] = useState("");
  const [modelo, setModelo] = useState(MODELOS_SINTESE[0].id);
  // Fila de documentos já lidos e ainda não enviados. O texto sai do arquivo
  // NO NAVEGADOR (ver lib/brain/extrair-texto) — a API recebe texto, nunca o
  // binário.
  const [fila, setFila] = useState<DocumentoExtraido[]>([]);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const falhou = (e: unknown) =>
    setAviso({
      erro: true,
      texto: e instanceof ErroApi ? e.mensagem : "A memória institucional não respondeu.",
    });

  const perguntar = useMutation({
    mutationFn: () => perguntarAoBrain(pergunta.trim()),
    onSuccess: (r) => {
      setResposta(r);
      setAviso(null);
    },
    onError: falhou,
  });

  const buscar = useMutation({
    mutationFn: () => buscarNoBrain(termo.trim()),
    onSuccess: (r) => {
      setAchados(r);
      setAviso(null);
    },
    onError: falhou,
  });

  const registrar = useMutation({
    mutationFn: () => registrarNoBrain(titulo.trim(), conteudo.trim()),
    onSuccess: (r) => {
      setAviso({ erro: false, texto: `Registrado em ${rotulo(r.fonte)} como ${r.slug}.` });
      setTitulo("");
      setConteudo("");
    },
    onError: falhou,
  });

  /** Um documento = uma página. Enviar em lote sequencialmente e não em
   *  paralelo: cada envio gera embeddings, e o modelo é local. */
  const enviarFila = useMutation({
    mutationFn: async () => {
      const enviados: string[] = [];
      for (const doc of fila) {
        const r = await registrarNoBrain(doc.titulo, doc.texto, doc.origem);
        enviados.push(`${doc.origem} → ${rotulo(r.fonte)}`);
      }
      return enviados;
    },
    onSuccess: (enviados) => {
      setFila([]);
      setAviso({ erro: false, texto: `${enviados.length} documento(s) na memória: ${enviados.join("; ")}.` });
    },
    onError: falhou,
  });

  const sincronizar = useMutation({
    mutationFn: sincronizarDadosBrain,
    onSuccess: (r) =>
      setAviso({
        erro: false,
        texto: r.publicadas
          ? `${r.publicadas} página(s) de indicadores publicada(s) na memória.`
          : (r.motivo ?? "Nada a publicar."),
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

  const config = useQuery({
    queryKey: ["brain-config"],
    queryFn: configBrain,
    enabled: podeAdministrar,
    staleTime: 60_000,
  });

  const salvarConfig = useMutation({
    mutationFn: (dados: { chaveOpenai?: string | null; modelo?: string }) => salvarConfigBrain(dados),
    onSuccess: (r) => {
      setChave("");
      void qc.invalidateQueries({ queryKey: ["brain-config"] });
      setAviso({
        erro: false,
        texto: r.temChave
          ? `Respostas pela OpenAI (${r.modelo}) — devem sair em segundos.`
          : "Chave removida. As respostas voltam ao modelo local da VPS (grátis, porém lento).",
      });
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

  return (
    <>
      {aviso && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
          border: `1px solid ${aviso.erro ? alfa("down", 0.4) : alfa("up", 0.4)}`,
          background: aviso.erro ? alfa("down", 0.09) : alfa("up", 0.09),
          color: aviso.erro ? C.down : C.up,
        }}>
          {aviso.texto}
        </div>
      )}

      {/* O alcance, dito antes de qualquer resposta: sem isto, "não achei
          nada" é indistinguível de "isso é de um setor que você não vê". */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
        marginBottom: 18, padding: "10px 14px", borderRadius: 10,
        border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.03),
      }}>
        <BookOpen size={14} style={{ color: C.gold }} />
        <span style={{ fontSize: 12, color: C.faint }}>Você consulta:</span>
        {(fontes.data?.leitura ?? []).map((f) => (
          <span key={f} style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: alfa("gold", 0.12), color: C.gold,
          }}>
            {rotulo(f)}
          </span>
        ))}
        {podeEscrever && fontes.data && (
          <span style={{ fontSize: 11.5, color: C.dim, marginLeft: "auto", fontWeight: 700 }}>
            registra em {rotulo(fontes.data.escrita)}
          </span>
        )}
      </div>

      <Bloco titulo="Perguntar" canto="Resposta sintetizada, com as fontes citadas">
        <textarea
          style={{ ...inputAv, minHeight: 70, resize: "vertical" as const, lineHeight: 1.5 }}
          value={pergunta}
          maxLength={600}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="O que eu preciso saber antes da reunião de fechamento do mês?"
        />
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => perguntar.mutate()}
            disabled={perguntar.isPending || pergunta.trim().length < 5}
            style={pergunta.trim().length >= 5 ? botaoOuro : botaoNeutro}
          >
            {perguntar.isPending ? <Loader2 size={13} className="girar" /> : <Sparkles size={13} />}
            {perguntar.isPending ? "Pensando…" : "Perguntar"}
          </button>
        </div>

        {resposta && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.hair}` }}>
            <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {resposta.resposta || "A memória não encontrou material para responder isto."}
            </div>
            {resposta.citacoes.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={labelAv}>Fontes citadas</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {resposta.citacoes.map((c, i) => (
                    <span key={`${c.slug}-${i}`} style={{
                      fontSize: 11.5, padding: "4px 9px", borderRadius: 8,
                      border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.04), color: C.muted,
                    }}>
                      {c.titulo || c.slug}
                      <span style={{ color: C.dim, fontWeight: 700 }}> · {rotulo(c.fonte)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Bloco>

      <Bloco titulo="Buscar" canto="As páginas em si, ranqueadas">
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <input
            style={{ ...inputAv, flex: 1, minWidth: 200 }}
            value={termo}
            maxLength={400}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && termo.trim().length >= 2) buscar.mutate();
            }}
            placeholder="matrícula, cancelamento, política de desconto…"
          />
          <button
            onClick={() => buscar.mutate()}
            disabled={buscar.isPending || termo.trim().length < 2}
            style={termo.trim().length >= 2 ? botaoOuro : botaoNeutro}
          >
            {buscar.isPending ? <Loader2 size={13} className="girar" /> : <Search size={13} />} Buscar
          </button>
        </div>

        {achados && (
          <div style={{ marginTop: 16 }}>
            <Estado vazio={achados.length === 0}
              vazioTitulo="Nada encontrado"
              vazioDica="Ou a memória ainda não tem material sobre isto, ou o assunto vive num setor fora do seu alcance.">
              <div style={{ display: "grid", gap: 10 }}>
                {achados.map((a) => (
                  <div key={a.slug} style={{
                    padding: "11px 13px", borderRadius: 10,
                    border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.03),
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.bright }}>{a.titulo}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".4px",
                        padding: "1px 7px", borderRadius: 20, background: alfa("gold", 0.12), color: C.gold,
                      }}>
                        {rotulo(a.fonte)}
                      </span>
                    </div>
                    {a.trecho && (
                      <div style={{ fontSize: 12, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>{a.trecho}</div>
                    )}
                    <div style={{ fontSize: 10.5, color: C.dim, marginTop: 5, fontWeight: 700 }}>{a.slug}</div>
                  </div>
                ))}
              </div>
            </Estado>
          </div>
        )}
      </Bloco>

      {podeEscrever && (
        <Bloco titulo="Registrar conhecimento" canto={fontes.data ? `Vai para ${rotulo(fontes.data.escrita)}` : undefined}>
          {/* Documento primeiro: é o caminho mais usado. Quem vai digitar
              direto rola e usa os campos abaixo. */}
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
              gap: 6, padding: "22px 16px", borderRadius: 12, cursor: "pointer", textAlign: "center",
              border: `1.5px dashed ${arrastando ? C.gold : C.cardLine}`,
              background: arrastando ? alfa("gold", 0.08) : alfa("sup", 0.03),
              transition: "background .15s ease, border-color .15s ease",
            }}
          >
            {lendo ? <Loader2 size={18} className="girar" style={{ color: C.gold }} /> : <Upload size={18} style={{ color: C.gold }} />}
            <div style={{ fontSize: 13, fontWeight: 700, color: C.bright }}>
              {lendo ? "Lendo o documento…" : "Arraste documentos aqui ou clique para escolher"}
            </div>
            <div style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.45, maxWidth: 460 }}>
              PDF, Markdown, TXT ou CSV. O texto é extraído no seu navegador e só ele viaja —
              o arquivo em si não sai do seu computador.
            </div>
            <input
              ref={entrada}
              type="file"
              accept={ACEITA}
              multiple
              onChange={(e) => void receber(e.target.files)}
              style={{ display: "none" }}
            />
          </div>

          {fila.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={labelAv}>Prontos para enviar</div>
              <div style={{ display: "grid", gap: 6 }}>
                {fila.map((doc, i) => (
                  <div key={`${doc.origem}-${i}`} style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "9px 11px",
                    borderRadius: 9, border: `1px solid ${C.cardLine}`, background: alfa("sup", 0.03),
                  }}>
                    <FileText size={14} style={{ color: C.gold, flexShrink: 0 }} />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.origem}
                      </span>
                      <span style={{ display: "block", fontSize: 11, color: C.faint, marginTop: 2 }}>
                        {doc.texto.length.toLocaleString("pt-BR")} caracteres de texto
                      </span>
                    </span>
                    <button
                      onClick={() => setFila((atual) => atual.filter((_, j) => j !== i))}
                      aria-label={`Tirar ${doc.origem} da fila`}
                      title="Tirar da fila"
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.dim, padding: 2 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => enviarFila.mutate()} disabled={enviarFila.isPending} style={botaoOuro}>
                  {enviarFila.isPending ? <Loader2 size={13} className="girar" /> : <Upload size={13} />}
                  {enviarFila.isPending ? "Indexando…" : `Enviar ${fila.length} documento(s)`}
                </button>
              </div>
            </div>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px",
            fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px",
          }}>
            <span style={{ flex: 1, height: 1, background: C.hair }} />
            ou escreva
            <span style={{ flex: 1, height: 1, background: C.hair }} />
          </div>

          <label style={labelAv} htmlFor="brain-titulo">Título</label>
          <input id="brain-titulo" style={inputAv} value={titulo} maxLength={160}
            onChange={(e) => setTitulo(e.target.value)} placeholder="Política de cancelamento de matrícula" />
          <label style={{ ...labelAv, marginTop: 12 }} htmlFor="brain-conteudo">Conteúdo</label>
          <textarea
            id="brain-conteudo"
            style={{ ...inputAv, minHeight: 150, resize: "vertical" as const, lineHeight: 1.55 }}
            value={conteudo}
            maxLength={20_000}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Markdown. O que ficar aqui passa a responder as perguntas de quem alcança este setor."
          />
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => registrar.mutate()}
              disabled={registrar.isPending || titulo.trim().length < 3 || conteudo.trim().length < 10}
              style={titulo.trim().length >= 3 && conteudo.trim().length >= 10 ? botaoOuro : botaoNeutro}
            >
              {registrar.isPending ? <Loader2 size={13} className="girar" /> : <PenLine size={13} />} Registrar
            </button>
          </div>
        </Bloco>
      )}

      {podeAdministrar && (
        <Bloco
          titulo="Motor de resposta"
          canto={
            config.data && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800,
                padding: "3px 9px", borderRadius: 20,
                background: config.data.provedor === "openai" ? alfa("up", 0.13) : alfa("warn", 0.13),
                color: config.data.provedor === "openai" ? C.up : C.warn,
              }}>
                {config.data.provedor === "openai" ? <Zap size={11} /> : <Cpu size={11} />}
                {config.data.provedor === "openai" ? "OpenAI" : "Modelo local"}
              </span>
            )
          }
        >
          <p style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.6, marginBottom: 16 }}>
            Quem <strong style={{ color: C.muted }}>encontra</strong> as páginas é a busca da própria VPS —
            isso não muda e não custa nada. Quem <strong style={{ color: C.muted }}>escreve a resposta</strong> é
            um modelo de linguagem: sem chave, roda o modelo local da VPS, que leva de 1 a 3 minutos por
            pergunta; com a chave da OpenAI, a resposta sai em segundos e custa frações de centavo por
            pergunta. Os documentos continuam sendo indexados localmente — a chave é usada só na hora de
            redigir a resposta.
          </p>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
            <div>
              <label style={labelAv} htmlFor="brain-chave">
                Chave da OpenAI {config.data?.temChave && "(uma já está gravada)"}
              </label>
              <input
                id="brain-chave"
                type="password"
                autoComplete="off"
                style={inputAv}
                value={chave}
                maxLength={200}
                onChange={(e) => setChave(e.target.value)}
                placeholder={config.data?.temChave ? "•••••••••• — digite para substituir" : "sk-..."}
              />
              <div style={{ fontSize: 11, color: C.dim, marginTop: 5, lineHeight: 1.45 }}>
                Guardada cifrada no banco do FebraHub. Não volta para esta tela nem aparece em log.
              </div>
            </div>
            <div>
              <label style={labelAv} htmlFor="brain-modelo">Modelo</label>
              <select
                id="brain-modelo"
                style={inputAv}
                value={config.data?.modelo ?? modelo}
                onChange={(e) => {
                  setModelo(e.target.value);
                  salvarConfig.mutate({ modelo: e.target.value });
                }}
              >
                {MODELOS_SINTESE.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome} — {m.nota}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => salvarConfig.mutate({ chaveOpenai: chave.trim(), modelo })}
              disabled={salvarConfig.isPending || chave.trim().length < 20}
              style={chave.trim().length >= 20 ? botaoOuro : botaoNeutro}
            >
              {salvarConfig.isPending ? <Loader2 size={13} className="girar" /> : <Key size={13} />} Salvar chave
            </button>
            {config.data?.temChave && (
              <button
                onClick={() => salvarConfig.mutate({ chaveOpenai: null })}
                disabled={salvarConfig.isPending}
                style={botaoNeutro}
              >
                Remover chave
              </button>
            )}
          </div>
        </Bloco>
      )}

      {podeAdministrar && (
        <Bloco
          titulo="Estado da memória"
          canto={
            <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <button
                onClick={() => sincronizar.mutate()}
                disabled={sincronizar.isPending}
                title="Publica os indicadores do Hub Executivo como páginas da memória"
                style={{
                  display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                  cursor: "pointer", color: C.gold, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, padding: 0,
                }}
              >
                {sincronizar.isPending ? <Loader2 size={12} className="girar" /> : <RefreshCw size={12} />}
                Publicar indicadores
              </button>
              <button
                onClick={() => revalidar.mutate()}
                disabled={revalidar.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
                  cursor: "pointer", color: C.gold, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, padding: 0,
                }}
              >
                {revalidar.isPending ? <Loader2 size={12} className="girar" /> : null} Revalidar acessos
              </button>
            </span>
          }
        >
          <Estado carregando={estado.isLoading} erro={estado.error}>
            {estado.data && !estado.data.disponivel && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Database size={15} style={{ color: C.down, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.bright }}>Serviço fora do ar</div>
                  <div style={{ fontSize: 12, color: C.faint, marginTop: 3, lineHeight: 1.5 }}>
                    O container do GBrain não respondeu. As consultas ficam indisponíveis até ele voltar.
                  </div>
                </div>
              </div>
            )}
            {estado.data?.disponivel && (
              <div style={{ display: "grid", gap: 2 }}>
                {estado.data.fontes.map((f) => (
                  <div key={f.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted }}>{rotulo(f.id)}</span>
                    <span style={{ fontSize: 12, color: C.faint }}>
                      {f.paginas === null ? "—" : `${f.paginas} página(s)`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Estado>
        </Bloco>
      )}
    </>
  );
}

const botaoBase = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
  borderRadius: 9, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
} as const;

const botaoOuro = { ...botaoBase, ...PINTURA_OURO };
const botaoNeutro = { ...botaoBase, background: alfa("sup", 0.05), color: C.muted, border: `1px solid ${C.cardLine}` };
