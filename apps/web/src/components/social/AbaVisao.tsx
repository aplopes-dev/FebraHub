"use client";

/* Visão geral — a primeira tela: quem somos nas redes, quanto crescemos e o
   que está na fila.

   A régua aqui é uma só: número que o Zernio não mede aparece como "—" e não
   como zero. A contagem de seguidores, por exemplo, depende do add-on de
   analytics da assinatura; sem ele, mostrar "0 seguidores" seria inventar uma
   queda que nunca houve. */

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, PenSquare } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { visaoGeralSocial } from "@/services/api/social";
import { C, alfaDe } from "@/lib/tema";
import type { ContaSocial, PontoSerie } from "@/types/social";
import { Cartao, GRADE_CARTOES, compacto, corRede, estadoDe, iconeRede, inteiro, nomeRede } from "./comum";

export function AbaVisao({ aoPublicar }: { aoPublicar: () => void }) {
  const visao = useQuery({
    queryKey: ["social-visao"],
    queryFn: visaoGeralSocial,
    staleTime: 60_000,
  });
  const v = visao.data;

  const contas = v?.contas ?? [];
  const total = v?.totalSeguidores ?? null;
  const precisamReconectar = contas.filter((c) => c.precisaReconectar);

  return (
    <Estado {...estadoDe(visao)}>
      <div style={GRADE_CARTOES}>
        <Cartao
          rotulo="Alcance total"
          valor={compacto(total)}
          nota={v?.temAnalytics ? `${contas.length} conta(s)` : "requer o add-on de análise"}
          cor={C.gold}
        />
        <Cartao rotulo="Publicadas em 30 dias" valor={inteiro(v?.publicadas30d)} />
        <Cartao rotulo="Na fila" valor={inteiro(v?.agendadas)} nota="agendadas e rascunhos" />
        <Cartao
          rotulo="Conversas abertas"
          valor={inteiro(v?.conversasAbertas)}
          cor={(v?.conversasAbertas ?? 0) > 0 ? C.up : undefined}
        />
      </div>

      {precisamReconectar.length > 0 && (
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 14px", marginBottom: 16,
          borderRadius: 11, background: alfaDe(C.warn, 0.08), border: `1px solid ${alfaDe(C.warn, 0.3)}`,
        }}>
          <AlertTriangle size={15} style={{ color: C.warn, marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>
            <strong style={{ color: C.warn }}>
              {precisamReconectar.length === 1 ? "Uma conta precisa" : `${precisamReconectar.length} contas precisam`} de reconexão
            </strong>{" "}
            — {precisamReconectar.map((c) => nomeRede(c.rede)).join(", ")}. Enquanto o token
            estiver vencido, toda publicação para {precisamReconectar.length === 1 ? "ela" : "elas"} vai
            falhar. A reconexão é feita no painel do Zernio.
          </div>
        </div>
      )}

      <Bloco
        titulo="Contas conectadas"
        canto={
          <button
            type="button"
            onClick={aoPublicar}
            className="fh-toque"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px",
              borderRadius: 8, border: `1px solid ${alfaDe(C.gold, 0.4)}`, cursor: "pointer",
              background: alfaDe(C.gold, 0.1), color: C.gold, fontSize: 11, fontWeight: 800,
            }}
          >
            <PenSquare size={11} />
            Publicar
          </button>
        }
      >
        <Estado
          vazio={contas.length === 0}
          vazioTitulo="Nenhuma conta vinculada"
          vazioDica="A chave está aceita, mas ainda não há rede conectada no Zernio. As contas são autorizadas por lá, uma vez, e passam a aparecer aqui."
        >
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10,
          }}>
            {contas.map((c) => (
              <CartaoConta key={c.id} conta={c} total={total} />
            ))}
          </div>
        </Estado>
      </Bloco>

      <Bloco titulo="Audiência" canto={v?.serie.length ? "últimos 90 dias" : undefined}>
        <Estado
          vazio={!v?.serie.length}
          vazioTitulo="Sem histórico de audiência"
          vazioDica="O Zernio começa a guardar a série de seguidores a partir do add-on de análise. Até lá, o painel mostra só a foto de hoje."
        >
          <Grafico pontos={v?.serie ?? []} />
        </Estado>
      </Bloco>
    </Estado>
  );
}

function CartaoConta({ conta, total }: { conta: ContaSocial; total: number | null }) {
  const Icone = iconeRede(conta.rede);
  const cor = corRede(conta.rede);
  const fatia = total && conta.seguidores ? (conta.seguidores / total) * 100 : 0;

  return (
    <div style={{
      background: C.card, border: `1px solid ${conta.precisaReconectar ? alfaDe(C.warn, 0.4) : C.cardLine}`,
      borderRadius: 13, padding: "12px 14px", minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Icone size={14} style={{ color: cor, flexShrink: 0 }} />
        <span style={{
          fontSize: 10, fontWeight: 800, color: C.faint, textTransform: "uppercase",
          letterSpacing: ".4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {nomeRede(conta.rede)}
        </span>
        {conta.url && (
          <a
            href={conta.url}
            target="_blank"
            rel="noreferrer"
            title="Abrir o perfil"
            style={{ marginLeft: "auto", color: C.faint, display: "flex" }}
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      <div style={{ fontSize: 21, fontWeight: 800, color: C.bright, marginTop: 8, lineHeight: 1.1 }}>
        {compacto(conta.seguidores)}
      </div>
      <div style={{
        fontSize: 10.5, color: C.faint, marginTop: 3, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {conta.usuario ? `@${conta.usuario}` : (conta.nome ?? "—")}
      </div>

      <div style={{ height: 3, borderRadius: 2, background: alfaDe(C.muted, 0.15), marginTop: 9, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, fatia)}%`, background: cor, opacity: 0.7 }} />
      </div>
    </div>
  );
}

/**
 * Linha da audiência somada. SVG puro e não uma biblioteca de gráfico: são
 * dois eixos e uma série — a dependência custaria mais peso do que o desenho.
 * O eixo Y começa no MENOR valor da série, não em zero: numa base de dezenas
 * de milhares, um eixo zerado achataria a curva numa reta.
 */
function Grafico({ pontos }: { pontos: PontoSerie[] }) {
  if (pontos.length < 2) {
    return (
      <div style={{ fontSize: 12.5, color: C.faint, padding: "10px 0" }}>
        {pontos.length === 1
          ? `Um único dia capturado (${pontos[0].data}). A curva aparece a partir do segundo.`
          : "Sem pontos suficientes para desenhar a curva."}
      </div>
    );
  }

  const L = 800;
  const A = 150;
  const valores = pontos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const faixa = max - min || 1;

  const x = (i: number) => (i / (pontos.length - 1)) * L;
  const y = (v: number) => A - ((v - min) / faixa) * (A - 16) - 8;

  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
  const area = `${linha} L${L},${A} L0,${A} Z`;

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const variacao = primeiro.valor ? ((ultimo.valor - primeiro.valor) / primeiro.valor) * 100 : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: C.bright }}>{compacto(ultimo.valor)}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: variacao >= 0 ? C.up : C.down }}>
          {variacao >= 0 ? "+" : ""}
          {variacao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
        </span>
        <span style={{ fontSize: 11, color: C.faint }}>
          desde {new Date(primeiro.data).toLocaleDateString("pt-BR")}
        </span>
      </div>
      <svg viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" style={{ width: "100%", height: 150, display: "block" }}>
        <defs>
          <linearGradient id="grad-audiencia" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad-audiencia)" />
        <path d={linha} fill="none" stroke={C.gold} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.faint, marginTop: 4 }}>
        <span>{new Date(primeiro.data).toLocaleDateString("pt-BR")}</span>
        <span>{new Date(ultimo.data).toLocaleDateString("pt-BR")}</span>
      </div>
    </div>
  );
}
