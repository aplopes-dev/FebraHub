"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { HubComercial } from "@/components/hubs/HubComercial";
import { HubEventos } from "@/components/hubs/HubEventos";
import { HubFinanceiro } from "@/components/hubs/HubFinanceiro";
import { HubLoja } from "@/components/hubs/HubLoja";
import { HubMarketing } from "@/components/hubs/HubMarketing";
import { HubPedagogico } from "@/components/hubs/HubPedagogico";
import { SemFonte } from "@/components/hubs/SemFonte";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { ROTAS_HUB, acharHub, hubInicial } from "@/lib/hubs";

/* Um hub por rota. O `tela` do protótipo virou o parâmetro da URL, e o
   switch continua sendo o mesmo — só que agora F5 e link direto funcionam.
   O Executivo saiu daqui: virou rota ESTÁTICA (app/(app)/executivo), que
   ganha da dinâmica — precisava de subrotas (indicadores/[codigo], metas). */
function conteudoDe(hub: string) {
  switch (hub) {
    case "comercial":  return <HubComercial />;
    case "financeiro": return <HubFinanceiro />;
    case "marketing":  return <HubMarketing />;
    case "pedagogico": return <HubPedagogico />;
    case "eventos":    return <HubEventos />;
    case "loja":       return <HubLoja />;
    case "estoque":    return <SemFonte hub={acharHub("estoque")} />;
    default:           return null;
  }
}

export default function PaginaHub({ params }: { params: Promise<{ hub: string }> }) {
  const { hub } = use(params);
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;

  /* Guarda de acesso. Esconder o hub no menu não é segurança — a API recusa
     o dado de quem não tem o setor de qualquer jeito. Isto aqui é UX: quem
     digita /financeiro sem ser do financeiro cai no próprio hub em vez de
     encarar uma tela de erros. */
  const permitido = !dados
    ? true
    : ehAdmin(dados) || setoresVisiveis(dados).includes(hub);
  const conhecido = ROTAS_HUB.includes(hub);
  const liberado = conhecido && permitido;

  useEffect(() => {
    if (!dados) return;
    if (liberado) return;
    const destino = hubInicial(setoresVisiveis(dados), pode(dados, "executivo.ver"));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!dados || !liberado) return <TelaCarregando />;
  return conteudoDe(hub);
}
