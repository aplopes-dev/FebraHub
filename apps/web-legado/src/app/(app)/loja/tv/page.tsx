"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Monitor } from "lucide-react";
import Link from "next/link";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { lojaOperacaoAtiva } from "@/services/api/loja-pedidos";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import "@/app/loja.css";
import "@/app/fila.css";

/** Atalho: abre o painel/TV público da operação ATIVA (rota por slug).
 *  Se não houver operação ativa (ou sem slug), mostra um aviso claro em vez
 *  de redirecionar silenciosamente — era o que fazia parecer "não abre". */
function AbrirTv() {
  const op = useQuery({ queryKey: ["loja-operacao-ativa"], queryFn: () => lojaOperacaoAtiva() });
  const [abriu, setAbriu] = useState(false);

  useEffect(() => {
    if (op.data?.slug && !abriu) {
      window.open(`/painel/${op.data.slug}`, "_blank");
      setAbriu(true);
    }
  }, [op.data, abriu]);

  if (op.isLoading) return <TelaCarregando />;

  const semOperacao = !op.data;
  const semSlug = op.data && !op.data.slug;

  return (
    <div className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">LOJA · PAINEL / TV</span>
          <h1>Painel público (TV)</h1>
          <p>Fila em tela cheia — só número e status, legível à distância.</p>
        </div>
        <Monitor style={{ width: 30, color: "var(--gold)" }} />
      </header>

      {semOperacao && (
        <div className="loja-card">
          <div className="fila-erro" style={{ marginBottom: 12 }}>
            Nenhuma operação ativa. O painel/TV abre a operação ativa da Loja.
          </div>
          <Link className="loja-btn ouro" href="/loja/operacoes">Criar / ativar uma operação</Link>
        </div>
      )}
      {semSlug && (
        <div className="loja-card">
          <div className="fila-erro" style={{ marginBottom: 12 }}>
            A operação ativa <b>{op.data?.nome}</b> não tem slug definido — necessário para a URL pública.
          </div>
          <Link className="loja-btn ouro" href="/loja/operacoes">Definir o slug em Operações</Link>
        </div>
      )}
      {op.data?.slug && (
        <div className="loja-card">
          <p>Abrindo o painel de <b>{op.data.nome}</b> em nova aba…</p>
          <a className="loja-btn ouro" href={`/painel/${op.data.slug}`} target="_blank" rel="noreferrer">Abrir painel / TV</a>
        </div>
      )}
    </div>
  );
}

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <AbrirTv />
    </GuardaPermissao>
  );
}
