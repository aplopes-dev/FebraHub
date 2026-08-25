"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { lojaOperacaoAtiva } from "@/services/api/loja-pedidos";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

/** Atalho: abre o cardápio público da operação ATIVA. Como a rota pública é
 *  por slug, resolvemos a operação ativa aqui e redirecionamos. */
function Redirecionar() {
  const router = useRouter();
  const op = useQuery({ queryKey: ["loja-operacao-ativa"], queryFn: () => lojaOperacaoAtiva() });

  useEffect(() => {
    if (op.data === undefined) return;
    if (op.data?.slug) window.open(`/cardapio/${op.data.slug}`, "_blank");
    router.replace("/loja/operacoes");
  }, [op.data, router]);

  if (op.data && !op.data.slug) {
    return <div className="loja-page"><div className="fila-erro">A operação ativa não tem slug definido — configure em Operações.</div></div>;
  }
  return <TelaCarregando />;
}

export default function Pagina() {
  return (
    <GuardaPermissao permissoes={["loja.pedidos.ver"]}>
      <Redirecionar />
    </GuardaPermissao>
  );
}
