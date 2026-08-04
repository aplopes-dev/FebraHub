"use client";

/* ============ MEMÓRIA INSTITUCIONAL (GBrain) ============
   Três blocos: perguntar (resposta sintetizada com citações), buscar
   (páginas cruas, ranqueadas) e registrar (grava na fonte do próprio setor).

   O recorte de acesso não é decidido aqui. Cada pessoa tem uma credencial
   própria no gbrain, com as fontes dos setores dela — a tela só MOSTRA quais
   são, para ninguém achar que a memória está vazia quando na verdade a
   pergunta caiu num setor que ela não alcança. */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, Database, Loader2, PenLine, Search, Sparkles } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { inputAv, labelAv } from "@/components/ui/estilos";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import {
  buscarNoBrain,
  estadoBrain,
  fontesBrain,
  perguntarAoBrain,
  registrarNoBrain,
  revalidarAcessosBrain,
} from "@/services/api/brain";
import { C, SANS, SOBRE_OURO, alfa } from "@/lib/tema";
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
          titulo="Estado da memória"
          canto={
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

const botaoOuro = { ...botaoBase, background: C.gold, color: SOBRE_OURO, border: `1px solid ${C.gold}` };
const botaoNeutro = { ...botaoBase, background: alfa("sup", 0.05), color: C.muted, border: `1px solid ${C.cardLine}` };
