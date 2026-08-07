"use client";

/* Campanhas pagas — o dinheiro. Meta (Facebook/Instagram) e as demais redes
   de anúncio que estiverem conectadas.

   O total do período NÃO soma CTR, CPC, CPM e ROAS: essas são razões, e média
   de médias não é média. Quem recalcula a partir dos somatórios é a API
   (somarMetricas), para o número do cabeçalho bater com o que o gerente de
   anúncios vê no painel do Meta.

   Pausar e reativar são as únicas escritas oferecidas. Criar campanha exige
   criativo, público, orçamento e revisão — trabalho do Gerenciador de
   Anúncios, não de um resumo executivo. */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pause, Play } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import { painelCampanhas, statusCampanha } from "@/services/api/social";
import { C, alfaDe } from "@/lib/tema";
import type { Campanha } from "@/types/social";
import {
  Aviso, Cartao, GRADE_CARTOES, Selo, SeloRede, compacto, corStatusSocial, dinheiro, estadoDe,
  inteiro, porcento, rotuloStatus,
} from "./comum";

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];

const REDES_ANUNCIO = [
  { id: "", rotulo: "Todas" },
  { id: "facebook", rotulo: "Meta" },
  { id: "google", rotulo: "Google" },
  { id: "tiktok", rotulo: "TikTok" },
  { id: "linkedin", rotulo: "LinkedIn" },
];

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const hoje = () => new Date().toISOString().slice(0, 10);

export function AbaCampanhas() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data ?? null;
  const podeGerenciar = pode(perfil, "social.gerenciar");

  const [dias, setDias] = useState(30);
  const [rede, setRede] = useState("");
  const [conta, setConta] = useState("");
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  const painel = useQuery({
    queryKey: ["social-campanhas", dias, rede, conta],
    queryFn: () =>
      painelCampanhas({
        rede: rede || undefined,
        contaAnuncio: conta || undefined,
        de: diasAtras(dias),
        ate: hoje(),
      }),
    staleTime: 2 * 60_000,
  });

  const p = painel.data;
  const t = p?.total;
  const moeda = p?.moeda ?? null;

  const alternar = useMutation({
    mutationFn: (c: Campanha) =>
      statusCampanha(c.id, c.rede, c.status === "active" ? "paused" : "active"),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["social-campanhas"] });
      setAviso({
        erro: false,
        texto: r.mensagem ?? `${r.atualizadas} campanha(s) atualizada(s).`,
      });
    },
    onError: (e: unknown) =>
      setAviso({
        erro: true,
        texto: e instanceof ErroApi ? e.mensagem : "A rede recusou a alteração.",
      }),
  });

  return (
    <div>
      {aviso && <Aviso erro={aviso.erro}>{aviso.texto}</Aviso>}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {PERIODOS.map((x) => (
          <button
            key={x.dias}
            type="button"
            className="fh-exec-chip fh-toque"
            style={dias === x.dias ? { color: C.gold, borderColor: alfaDe(C.gold, 0.5), background: alfaDe(C.gold, 0.08) } : undefined}
            onClick={() => setDias(x.dias)}
            aria-pressed={dias === x.dias}
          >
            {x.rotulo}
          </button>
        ))}
        <span style={{ width: 10 }} />
        {REDES_ANUNCIO.map((r) => (
          <button
            key={r.id}
            type="button"
            className="fh-exec-chip fh-toque"
            style={rede === r.id ? { color: C.gold, borderColor: alfaDe(C.gold, 0.5), background: alfaDe(C.gold, 0.08) } : undefined}
            onClick={() => setRede(r.id)}
            aria-pressed={rede === r.id}
          >
            {r.rotulo}
          </button>
        ))}
        {(p?.contas.length ?? 0) > 1 && (
          <select
            value={conta}
            onChange={(e) => setConta(e.target.value)}
            style={{
              marginLeft: "auto", padding: "6px 10px", borderRadius: 9, fontSize: 12, maxWidth: 260,
              background: alfaDe(C.muted, 0.06), border: `1px solid ${C.cardLine}`, color: C.text,
            }}
          >
            <option value="">Todas as contas de anúncio</option>
            {(p?.contas ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        )}
      </div>

      <Estado {...estadoDe(painel)}>
        <div style={GRADE_CARTOES}>
          <Cartao rotulo="Investido" valor={dinheiro(t?.gasto ?? null, moeda)} cor={C.gold} nota={`últimos ${dias} dias`} />
          <Cartao rotulo="Alcance" valor={compacto(t?.alcance ?? null)} nota="pessoas únicas" />
          <Cartao rotulo="Impressões" valor={compacto(t?.impressoes ?? null)} />
          <Cartao rotulo="Cliques" valor={inteiro(t?.cliques ?? null)} nota={t ? `CTR ${porcento(t.ctr)}` : undefined} />
          <Cartao rotulo="Custo por clique" valor={dinheiro(t?.cpc ?? null, moeda)} nota={t ? `CPM ${dinheiro(t.cpm, moeda)}` : undefined} />
          <Cartao
            rotulo="Conversões"
            valor={inteiro(t?.conversoes ?? null)}
            nota={t && t.conversoes > 0 ? `${dinheiro(t.custoPorConversao, moeda)} cada` : undefined}
            cor={t && t.conversoes > 0 ? C.up : undefined}
          />
          <Cartao
            rotulo="Retorno (ROAS)"
            valor={t && t.roas > 0 ? `${t.roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×` : "—"}
            nota={t && t.valorConvertido > 0 ? dinheiro(t.valorConvertido, moeda) : "sem valor de conversão"}
            cor={t && t.roas >= 1 ? C.up : t && t.roas > 0 ? C.warn : undefined}
          />
        </div>

        {p && !p.moeda && p.campanhas.length > 0 && (
          <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 12, lineHeight: 1.55 }}>
            As campanhas do recorte estão em moedas diferentes — os valores acima somam números de
            moedas distintas. Filtre por conta de anúncio para um total confiável.
          </div>
        )}

        <Bloco titulo="Campanhas" canto={p ? `${p.campanhas.length} no período` : undefined} sem>
          <Estado
            vazio={!painel.isPending && (p?.campanhas.length ?? 0) === 0}
            vazioTitulo="Nenhuma campanha no período"
            vazioDica="Ou não houve veiculação nesses dias, ou a conta de anúncios ainda não foi conectada ao Zernio."
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 860 }}>
                <thead>
                  <tr>
                    {["Campanha", "Status", "Investido", "Alcance", "Cliques", "CTR", "CPC", "Conv.", "ROAS", ""].map(
                      (h, i) => (
                        <th
                          key={h || "acao"}
                          style={{
                            textAlign: i <= 1 ? "left" : i === 9 ? "center" : "right",
                            padding: "9px 14px", fontSize: 10, fontWeight: 800, color: C.faint,
                            textTransform: "uppercase", letterSpacing: ".4px",
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
                  {(p?.campanhas ?? []).map((c) => (
                    <LinhaCampanha
                      key={`${c.rede}-${c.id}`}
                      campanha={c}
                      podeGerenciar={podeGerenciar}
                      ocupado={alternar.isPending}
                      aoAlternar={() => alternar.mutate(c)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Estado>
        </Bloco>
      </Estado>
    </div>
  );
}

function LinhaCampanha({
  campanha, podeGerenciar, ocupado, aoAlternar,
}: {
  campanha: Campanha;
  podeGerenciar: boolean;
  ocupado: boolean;
  aoAlternar: () => void;
}) {
  const c = campanha;
  const m = c.metricas;
  const ativa = c.status === "active";
  const alternavel = ativa || c.status === "paused";

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
      <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.hair}`, maxWidth: 300 }}>
        <div style={{
          color: C.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {c.nome}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
          <SeloRede rede={c.rede} compactoTexto />
          <span style={{ fontSize: 10, color: C.faint }}>
            {c.anuncios} anúncio(s)
            {c.orcamento ? ` · ${dinheiro(c.orcamento, c.moeda)}${c.nivelOrcamento === "daily" ? "/dia" : ""}` : ""}
          </span>
        </div>
      </td>
      <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.hair}` }}>
        <Selo texto={rotuloStatus(c.status)} cor={corStatusSocial(c.status)} />
      </td>
      {celula(dinheiro(m.gasto, c.moeda), true)}
      {celula(compacto(m.alcance))}
      {celula(inteiro(m.cliques))}
      {celula(porcento(m.ctr))}
      {celula(dinheiro(m.cpc, c.moeda))}
      {celula(inteiro(m.conversoes))}
      {celula(m.roas > 0 ? `${m.roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×` : "—")}
      <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.hair}`, textAlign: "center" }}>
        {podeGerenciar && alternavel && (
          <button
            type="button"
            className="fh-toque"
            disabled={ocupado}
            onClick={aoAlternar}
            title={ativa ? "Pausar a campanha" : "Reativar a campanha"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
              borderRadius: 8, cursor: ocupado ? "wait" : "pointer",
              border: `1px solid ${alfaDe(ativa ? C.warn : C.up, 0.35)}`,
              background: alfaDe(ativa ? C.warn : C.up, 0.08),
              color: ativa ? C.warn : C.up, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
            }}
          >
            {ocupado ? <Loader2 size={11} className="girar" /> : ativa ? <Pause size={11} /> : <Play size={11} />}
            {ativa ? "Pausar" : "Reativar"}
          </button>
        )}
      </td>
    </tr>
  );
}
