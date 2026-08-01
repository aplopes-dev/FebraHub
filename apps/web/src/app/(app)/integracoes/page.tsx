"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plug, RefreshCw, ShieldAlert, Unplug, type LucideIcon } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, setoresDo, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";
import { C, SANS, SOBRE_OURO_2, alfa, alfaDe } from "@/lib/tema";
import {
  desconectarIntegracao,
  listarIntegracoes,
  renovarIntegracao,
  urlAutorizacao,
  type Integracao,
  type SituacaoIntegracao,
} from "@/services/api/integracoes";

/* ============ INTEGRAÇÕES ============
   A tela que substitui o Postman. Cada fonte que fala OAuth2 aparece aqui com
   o estado real do token e dois botões: autorizar no navegador (uma vez) e
   renovar sem navegador (quando dá).

   O que ela NÃO mostra: o token. A API devolve `tem_token` e datas — o valor
   não existe deste lado. */

const CHAVE = ["integracoes"] as const;

const ROTULO: Record<SituacaoIntegracao, string> = {
  conectada: "Conectada",
  expira_em_breve: "Expira em breve",
  expirada: "Expirada",
  nunca_conectada: "Nunca conectada",
};

/* Verde só quando está de pé; âmbar quando ainda dá tempo de agir sozinho;
   vermelho quando já exige alguém no navegador. */
const COR: Record<SituacaoIntegracao, string> = {
  conectada: C.up,
  expira_em_breve: C.warn,
  expirada: C.down,
  nunca_conectada: C.down,
};

const dataHora = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

/** "em 43 dias" / "há 2 dias" — a distância importa mais que a data exata. */
function distancia(iso: string | null): string {
  if (!iso) return "";
  const dias = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (dias === 0) return "hoje";
  return dias > 0 ? `em ${dias} dia${dias > 1 ? "s" : ""}` : `há ${-dias} dia${dias < -1 ? "s" : ""}`;
}

export default function PaginaIntegracoes() {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  const qc = useQueryClient();
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  /* Mesma guarda dos hubs: esconder o menu não é segurança — a API exige o
     setor 'geral' de qualquer jeito. Isto aqui é UX, para quem digitar
     /integracoes sem ser admin cair no próprio painel em vez de num 403. */
  const liberado = !dados || ehAdmin(dados);
  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresDo(dados), false);
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  const lista = useQuery<Integracao[], Error>({
    queryKey: CHAVE,
    queryFn: listarIntegracoes,
    // Estado operacional: 30s para o painel refletir uma reconexão feita na
    // aba ao lado sem precisar de F5.
    staleTime: 30_000,
    // Contraria o padrão global (refetchOnWindowFocus: false, que existe
    // porque o painel fica aberto na TV o dia inteiro). Aqui é o oposto: a
    // autorização acontece em OUTRA aba, e voltar para esta é exatamente o
    // momento em que o estado mudou.
    refetchOnWindowFocus: true,
    enabled: !!dados && liberado,
  });

  const conectar = useMutation({
    /* Aba nova: o provedor recusa carregar dentro de iframe, e navegar por
       cima do painel perderia o contexto de quem clicou.

       A aba é aberta ANTES do fetch, ainda dentro do clique: um
       `window.open` depois de um `await` já está fora do gesto do usuário e o
       bloqueador de pop-up o descarta. Ela nasce em branco e só recebe a URL
       quando a API responde.

       Sem `noopener` porque com essa flag o navegador devolve `null` e não
       haveria como navegá-la; o `opener` é anulado logo em seguida, o que
       fecha a mesma brecha (reverse tabnabbing). */
    mutationFn: async (fonte: string) => {
      const aba = window.open("", "_blank");
      if (aba) aba.opener = null;
      try {
        const r = await urlAutorizacao(fonte);
        if (aba) aba.location.href = r.url;
        return { ...r, abriu: !!aba };
      } catch (e) {
        aba?.close();
        throw e;
      }
    },
    onSuccess: (r) =>
      setAviso(
        r.abriu
          ? null
          : {
              erro: true,
              texto: `O navegador bloqueou a aba de autorização. Abra este endereço manualmente: ${r.url}`,
            },
      ),
    onError: (e: Error) => setAviso({ erro: true, texto: e.message }),
  });

  const renovar = useMutation({
    mutationFn: renovarIntegracao,
    onSuccess: (r) => {
      setAviso({
        erro: false,
        texto: r.expira_em
          ? `Token renovado — vence ${distancia(r.expira_em)} (${dataHora(r.expira_em)}).`
          : "Token renovado.",
      });
      void qc.invalidateQueries({ queryKey: CHAVE });
    },
    onError: (e: Error) => setAviso({ erro: true, texto: e.message }),
  });

  const desconectar = useMutation({
    mutationFn: desconectarIntegracao,
    onSuccess: () => {
      setAviso({ erro: false, texto: "Token removido. Use Conectar para autorizar de novo." });
      void qc.invalidateQueries({ queryKey: CHAVE });
    },
    onError: (e: Error) => setAviso({ erro: true, texto: e.message }),
  });

  if (!dados || !liberado) return <TelaCarregando />;

  const ocupada = (fonte: string) =>
    (conectar.isPending && conectar.variables === fonte) ||
    (renovar.isPending && renovar.variables === fonte) ||
    (desconectar.isPending && desconectar.variables === fonte);

  return (
    <>
      <SecaoTitulo
        titulo="Conexões das fontes"
        canto="Autorização OAuth feita pelo próprio sistema — sem ferramenta externa."
      />

      {aviso && (
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16,
          padding: "12px 14px", borderRadius: 12,
          // `alfa` precisa do NOME do token; aqui a cor já vem resolvida como
          // var(), então a transparência sai por color-mix (alfaDe).
          border: `1px solid ${alfaDe(aviso.erro ? C.down : C.up, 0.35)}`,
          background: aviso.erro ? alfa("down", 0.08) : alfa("up", 0.08),
        }}>
          <ShieldAlert size={15} style={{ color: aviso.erro ? C.down : C.up, marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>{aviso.texto}</span>
        </div>
      )}

      <Estado
        carregando={lista.isLoading}
        erro={lista.error}
        vazio={!!lista.data && lista.data.length === 0}
        vazioTitulo="Nenhuma fonte OAuth cadastrada"
      >
        {(lista.data ?? []).map((i) => (
          <Bloco
            key={i.fonte}
            titulo={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: COR[i.situacao] }} />
                {i.nome}
              </span>
            }
            canto={<span style={{ color: COR[i.situacao], fontWeight: 700 }}>{ROTULO[i.situacao]}</span>}
          >
            {!i.configurada && (
              <div style={{ fontSize: 12.5, color: C.warn, marginBottom: 14, lineHeight: 1.6 }}>
                Falta configurar na API: <b>{i.faltando.join(", ")}</b>. Enquanto isso, conectar e
                renovar respondem erro em vez de funcionar.
              </div>
            )}

            <div style={{
              display: "grid", gap: "10px 26px", marginBottom: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            }}>
              <Campo rotulo="Validade do token">
                {i.tem_token ? (
                  <>
                    {i.expira_em ? `${dataHora(i.expira_em)} · ${distancia(i.expira_em)}` : "sem data declarada"}
                  </>
                ) : (
                  "sem token guardado"
                )}
              </Campo>
              <Campo rotulo="Token gravado em">{dataHora(i.atualizado_em)}</Campo>
              <Campo rotulo="Última sincronização">
                {dataHora(i.ultima_sync)}
                {i.status_sync && i.status_sync !== "ok" && (
                  <span style={{ color: C.down }}> · {i.status_sync}</span>
                )}
              </Campo>
            </div>

            <div style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.6, marginBottom: 16 }}>
              {i.nota_validade}
            </div>

            {/* A verdade sobre a rotina automática. Sem isto, uma renovação que
                vem falhando todo dia ficaria invisível até a fonte parar — foi
                assim que o Conta Azul passou dias quebrado sem ninguém ver. */}
            {i.ultima_renovacao && (
              <div style={{
                fontSize: 11.5, lineHeight: 1.6, marginBottom: 16,
                color: i.ultima_renovacao.ok ? C.faint : C.down,
              }}>
                Renovação automática em {dataHora(i.ultima_renovacao.em)}:{" "}
                {i.ultima_renovacao.ok ? "ok" : i.ultima_renovacao.mensagem ?? "falhou"}
              </div>
            )}

            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 16 }}>
              <Botao
                onClick={() => conectar.mutate(i.fonte)}
                ocupado={ocupada(i.fonte)}
                primario
                Icone={i.tem_token ? RefreshCw : Plug}
              >
                {i.tem_token ? "Reconectar" : "Conectar"}
              </Botao>
              {/* Renovar só faz sentido com token guardado: é ele a matéria-prima
                  do refresh (Conta Azul) e da troca (Meta). */}
              {i.tem_token && (
                <Botao onClick={() => renovar.mutate(i.fonte)} ocupado={ocupada(i.fonte)} Icone={RefreshCw}>
                  Renovar agora
                </Botao>
              )}
              {i.tem_token && (
                <Botao onClick={() => desconectar.mutate(i.fonte)} ocupado={ocupada(i.fonte)} perigo Icone={Unplug}>
                  Desconectar
                </Botao>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${C.hair}`, paddingTop: 13 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase",
                color: C.dim, marginBottom: 6,
              }}>
                URL de redirecionamento
              </div>
              {/* Selecionável: é para copiar e colar no painel do provedor. */}
              <code style={{
                display: "block", userSelect: "all", fontSize: 12, color: C.bright,
                background: alfa("sup", 0.05), border: `1px solid ${C.cardLine}`,
                borderRadius: 8, padding: "8px 10px", wordBreak: "break-all",
              }}>
                {i.redirect_uri}
              </code>
              <div style={{ fontSize: 11.5, color: C.faint, marginTop: 7, lineHeight: 1.6 }}>
                Precisa estar cadastrada <b>exatamente assim</b> no painel do provedor
                (<ExternalLink size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> app do{" "}
                {i.nome}). Uma barra a mais e o provedor recusa a autorização antes de começar.
              </div>
            </div>
          </Bloco>
        ))}
      </Estado>
    </>
  );
}

/* ---------------- peças locais ---------------- */

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase",
        color: C.dim, marginBottom: 4,
      }}>
        {rotulo}
      </div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{children}</div>
    </div>
  );
}

function Botao({
  onClick, ocupado, primario, perigo, Icone, children,
}: {
  onClick: () => void;
  ocupado?: boolean;
  primario?: boolean;
  perigo?: boolean;
  Icone: LucideIcon;
  children: React.ReactNode;
}) {
  const fundo = primario ? `linear-gradient(90deg, ${C.goldTop}, ${C.goldBase})` : alfa("sup", 0.06);
  const cor = primario ? SOBRE_OURO_2 : perigo ? C.down : C.muted;
  return (
    <button onClick={onClick} disabled={ocupado} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px",
      borderRadius: 10, fontFamily: SANS, fontSize: 12.5, fontWeight: 800,
      border: primario ? "none" : `1px solid ${C.cardLine}`,
      background: ocupado ? alfa("sup", 0.08) : fundo,
      color: ocupado ? C.faint : cor,
      cursor: ocupado ? "default" : "pointer",
    }}>
      <Icone size={14} className={ocupado ? "girar" : undefined} /> {children}
    </button>
  );
}
