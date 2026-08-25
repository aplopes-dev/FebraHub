"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";
import Link from "next/link";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { lojaOperacaoAtiva } from "@/services/api/loja-pedidos";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import "@/app/loja.css";
import "@/app/fila.css";

/** Atalho: abre o cardápio público da operação ATIVA. Mostra aviso claro
 *  quando não há operação ativa (evita o "não abre" silencioso). */
function AbrirCardapio() {
  const op = useQuery({ queryKey: ["loja-operacao-ativa"], queryFn: () => lojaOperacaoAtiva() });
  const [abriu, setAbriu] = useState(false);

  useEffect(() => {
    if (op.data?.slug && !abriu) {
      window.open(`/cardapio/${op.data.slug}`, "_blank");
      setAbriu(true);
    }
  }, [op.data, abriu]);

  if (op.isLoading) return <TelaCarregando />;

  return (
    <div className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">LOJA · CARDÁPIO</span>
          <h1>Cardápio digital</h1>
          <p>Abre o cardápio público da operação ativa (para conferir / testar).</p>
        </div>
        <Store style={{ width: 30, color: "var(--gold)" }} />
      </header>

      {!op.data && (
        <div className="loja-card">
          <div className="fila-erro" style={{ marginBottom: 12 }}>
            Nenhuma operação ativa. O cardápio público é sempre de uma operação.
          </div>
          <Link className="loja-btn ouro" href="/loja/operacoes">Criar / ativar uma operação</Link>
        </div>
      )}
      {op.data && !op.data.slug && (
        <div className="loja-card">
          <div className="fila-erro" style={{ marginBottom: 12 }}>
            A operação ativa <b>{op.data.nome}</b> não tem slug — necessário para a URL pública.
          </div>
          <Link className="loja-btn ouro" href="/loja/operacoes">Definir o slug em Operações</Link>
        </div>
      )}
      {op.data?.slug && (
        <div className="loja-card">
          <p>Abrindo o cardápio de <b>{op.data.nome}</b> em nova aba…</p>
          <a className="loja-btn ouro" href={`/cardapio/${op.data.slug}`} target="_blank" rel="noreferrer">Abrir cardápio</a>
        </div>
      )}
    </div>
  );
}

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <AbrirCardapio />
    </GuardaPermissao>
  );
}
