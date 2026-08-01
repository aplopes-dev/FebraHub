"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell/Shell";
import { SemPerfil } from "@/components/shell/SemPerfil";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { usePerfil, useSessao } from "@/hooks/auth";

/** Layout dos hubs: a sessão é resolvida uma vez aqui e o Shell (sidebar,
 *  cabeçalho e o provedor de período/categoria) envolve todas as rotas de
 *  hub. Trocar de hub troca só o conteúdo — o filtro do topo sobrevive à
 *  navegação, que é o comportamento do protótipo. */
export default function LayoutApp({ children }: { children: ReactNode }) {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();

  useEffect(() => {
    if (sessao === null) router.replace("/login");
  }, [sessao, router]);

  if (sessao === undefined || (sessao && perfil.isLoading)) return <TelaCarregando />;
  if (!sessao) return <TelaCarregando />;
  if (perfil.error || !perfil.data) return <SemPerfil />;

  return <Shell perfil={perfil.data}>{children}</Shell>;
}
