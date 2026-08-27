"use client";

/* Postagens e análise — o que saiu, para onde, e como foi.

   As duas coisas ficam na mesma aba porque respondem em sequência: "publicou?"
   e logo depois "deu resultado?". Em telas separadas, conferir um post exigiria
   procurá-lo duas vezes.

   Regra de honestidade que atravessa a tela toda: métrica ausente é "—". O
   Zernio só entrega engajamento com o add-on de análise, e certas redes
   demoram horas para consolidar. Quando o dado ainda não chegou, o selo de
   sincronia diz isso em vez de a coluna mostrar zero. */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import {
  analiseSocial, apagarPostagem, contasSocial, listarPostagens, reenviarPostagem,
} from "@/services/api/social";
import { C, alfaDe } from "@/lib/tema";
import type { AnalisePostagem, Postagem } from "@/types/social";
import {
  Aviso, Selo, SeloRede, compacto, corStatusSocial, desde, estadoDe, inteiro, nomeRede, porcento,
  quando, rotuloStatus,
} from "./comum";

const FILTROS: { id: string; rotulo: string }[] = [
  { id: "", rotulo: "Todas" },
  { id: "published", rotulo: "Publicadas" },
  { id: "scheduled", rotulo: "Agendadas" },
  { id: "draft", rotulo: "Rascunhos" },
  { id: "failed", rotulo: "Falharam" },
];

export function AbaPostagens() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data ?? null;
  const podePublicar = pode(perfil, "social.publicar");

  const [status, setStatus] = useState("");
  const [rede, setRede] = useState("");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  const contas = useQuery({ queryKey: ["social-contas"], queryFn: contasSocial, staleTime: 5 * 60_000 });
  const redes = [...new Set((contas.data?.contas ?? []).filter((c) => !c.deAnuncio).map((c) => c.rede))];

  const lista = useQuery({
    queryKey: ["social-postagens", status, rede],
    queryFn: () => listarPostagens({ status: status || undefined, rede: rede || undefined, limite: 20 }),
    staleTime: 45_000,
  });

  const analise = useQuery({
    queryKey: ["social-analise", rede],
    queryFn: () => analiseSocial({ rede: rede || undefined, limite: 12, ordenarPor: "date" }),
    staleTime: 60_000,
  });

  const falhou = (e: unknown) =>
    setAviso({ erro: true, texto: e instanceof ErroApi ? e.mensagem : "O Zernio não respondeu." });

  const apagar = useMutation({
    mutationFn: apagarPostagem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-postagens"] });
      setAviso({ erro: false, texto: "Postagem removida." });
    },
    onError: falhou,
  });

  const reenviar = useMutation({
    mutationFn: reenviarPostagem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-postagens"] });
      setAviso({ erro: false, texto: "Reenviada. O status atualiza em instantes." });
    },
    onError: falhou,
  });

  return (
    <div>
      {aviso && <Aviso erro={aviso.erro}>{aviso.texto}</Aviso>}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="fh-exec-chip fh-toque"
            style={status === f.id ? { color: C.gold, borderColor: alfaDe(C.gold, 0.5), background: alfaDe(C.gold, 0.08) } : undefined}
            onClick={() => setStatus(f.id)}
            aria-pressed={status === f.id}
          >
            {f.rotulo}
          </button>
        ))}
        {redes.length > 1 && (
          <select
            value={rede}
            onChange={(e) => setRede(e.target.value)}
            style={{
              marginLeft: "auto", padding: "6px 10px", borderRadius: 9, fontSize: 12,
              background: alfaDe(C.muted, 0.06), border: `1px solid ${C.cardLine}`, color: C.text,
            }}
          >
            <option value="">Todas as redes</option>
            {redes.map((r) => (
              <option key={r} value={r}>{nomeRede(r)}</option>
            ))}
          </select>
        )}
      </div>

      <Bloco
        titulo="Postagens"
        canto={lista.data ? `${lista.data.total} no total` : undefined}
        sem
      >
        <Estado
          {...estadoDe(lista)}
          vazio={!lista.isPending && (lista.data?.postagens.length ?? 0) === 0}
          vazioTitulo="Nenhuma postagem neste recorte"
          vazioDica="Troque o filtro acima, ou publique a primeira pela aba Publicar."
        >
          <div>
            {(lista.data?.postagens ?? []).map((p) => (
              <LinhaPostagem
                key={p.id}
                postagem={p}
                podePublicar={podePublicar}
                ocupado={apagar.isPending || reenviar.isPending}
                aoApagar={() => apagar.mutate(p.id)}
                aoReenviar={() => reenviar.mutate(p.id)}
              />
            ))}
          </div>
        </Estado>
      </Bloco>

      <Bloco titulo="Desempenho das publicadas" canto="últimos 30 dias" sem>
        <Estado
          {...estadoDe(analise)}
          vazio={!analise.isPending && (analise.data?.length ?? 0) === 0}
          vazioTitulo="Sem números de desempenho"
          vazioDica="O Zernio entrega engajamento com o add-on de análise da assinatura. Sem ele, as postagens aparecem acima mas sem métrica."
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 720 }}>
              <thead>
                <tr>
                  {["Publicação", "Rede", "Quando", "Alcance", "Impressões", "Curtidas", "Coment.", "Engaj."].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i <= 2 ? "left" : "right", padding: "9px 14px", fontSize: 10,
                          fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".4px",
                          borderBottom: `1px solid ${C.hair}`, whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(analise.data ?? []).map((a, i) => (
                  <LinhaAnalise key={`${a.postId}-${a.rede}-${i}`} analise={a} />
                ))}
              </tbody>
            </table>
          </div>
        </Estado>
      </Bloco>
    </div>
  );
}

function LinhaPostagem({
  postagem, podePublicar, ocupado, aoApagar, aoReenviar,
}: {
  postagem: Postagem;
  podePublicar: boolean;
  ocupado: boolean;
  aoApagar: () => void;
  aoReenviar: () => void;
}) {
  const p = postagem;
  const falhou = p.status === "failed" || p.destinos.some((d) => d.status === "failed");
  const removivel = p.status === "scheduled" || p.status === "draft";
  const publicado = p.destinos.find((d) => d.url);
  const erro = p.destinos.find((d) => d.erro)?.erro;

  return (
    <div style={{ padding: "13px 20px", borderBottom: `1px solid ${C.hair}` }}>
      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap", marginBottom: 7 }}>
        <Selo texto={rotuloStatus(p.status)} cor={corStatusSocial(p.status)} />
        {p.destinos.map((d, i) => (
          <SeloRede key={`${d.rede}-${i}`} rede={d.rede} />
        ))}
        <span style={{ fontSize: 11, color: C.faint, marginLeft: "auto", whiteSpace: "nowrap" }}>
          {p.status === "scheduled" && p.agendadaPara
            ? `para ${quando(p.agendadaPara)}`
            : (desde(p.destinos.find((d) => d.publicadaEm)?.publicadaEm ?? p.criadaEm) || quando(p.criadaEm))}
        </span>
      </div>

      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {p.titulo && <strong style={{ color: C.bright, display: "block" }}>{p.titulo}</strong>}
        {p.conteudo.length > 260 ? `${p.conteudo.slice(0, 260)}…` : p.conteudo || "— sem texto —"}
      </div>

      {erro && (
        <div style={{ fontSize: 11.5, color: C.down, marginTop: 6, lineHeight: 1.5 }}>{erro}</div>
      )}

      {(publicado || removivel || falhou) && (
        <div style={{ display: "flex", gap: 8, marginTop: 9, alignItems: "center", flexWrap: "wrap" }}>
          {publicado?.url && (
            <a
              href={publicado.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5,
                fontWeight: 700, color: C.gold, textDecoration: "none",
              }}
            >
              Ver na rede <ExternalLink size={11} />
            </a>
          )}
          {podePublicar && falhou && (
            <button
              type="button"
              className="fh-toque"
              disabled={ocupado}
              onClick={aoReenviar}
              style={acaoLinha(C.warn, ocupado)}
            >
              {ocupado ? <Loader2 size={11} className="girar" /> : <RefreshCw size={11} />}
              Tentar de novo
            </button>
          )}
          {podePublicar && removivel && (
            <button
              type="button"
              className="fh-toque"
              disabled={ocupado}
              onClick={aoApagar}
              style={acaoLinha(C.down, ocupado)}
            >
              <Trash2 size={11} />
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const acaoLinha = (cor: string, ocupado: boolean) => ({
  display: "inline-flex" as const,
  alignItems: "center" as const,
  gap: 5,
  padding: "3px 9px",
  borderRadius: 8,
  border: `1px solid ${alfaDe(cor, 0.35)}`,
  background: alfaDe(cor, 0.08),
  color: cor,
  fontSize: 11,
  fontWeight: 700,
  cursor: ocupado ? "wait" : "pointer",
  opacity: ocupado ? 0.6 : 1,
});

function LinhaAnalise({ analise }: { analise: AnalisePostagem }) {
  const a = analise;
  const m = a.metricas;
  const pendente = a.sincronia === "pending" || a.sincronia === "unavailable";

  const celula = (v: string, forte = false) => (
    <td style={{
      padding: "9px 14px", textAlign: "right", borderBottom: `1px solid ${C.hair}`,
      color: forte ? C.bright : C.muted, fontWeight: forte ? 700 : 400, whiteSpace: "nowrap",
    }}>
      {v}
    </td>
  );

  return (
    <tr>
      <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.hair}`, maxWidth: 320 }}>
        <div style={{
          color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {a.url ? (
            <a href={a.url} target="_blank" rel="noreferrer" style={{ color: C.text, textDecoration: "none" }}>
              {a.conteudo.split("\n")[0] || "— sem texto —"}
            </a>
          ) : (
            a.conteudo.split("\n")[0] || "— sem texto —"
          )}
        </div>
        {pendente && (
          <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
            {a.sincronia === "pending" ? "números ainda consolidando" : "sem dados da rede"}
          </div>
        )}
      </td>
      <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.hair}` }}>
        <SeloRede rede={a.rede} />
      </td>
      <td style={{
        padding: "9px 14px", borderBottom: `1px solid ${C.hair}`, color: C.faint, whiteSpace: "nowrap",
      }}>
        {desde(a.publicadaEm) || quando(a.publicadaEm)}
      </td>
      {celula(compacto(m.alcance), true)}
      {celula(compacto(m.impressoes))}
      {celula(inteiro(m.curtidas))}
      {celula(inteiro(m.comentarios))}
      {celula(porcento(m.taxaEngajamento))}
    </tr>
  );
}
