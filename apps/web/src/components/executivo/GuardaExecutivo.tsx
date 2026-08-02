"use client";

/* Guarda de UX das rotas /executivo/*: só a diretoria (admin) as abre —
   a mesma regra que valia quando o Executivo morava na rota dinâmica.
   Não é segurança (a API recorta por setor de qualquer forma); é para quem
   digita a URL sem perfil cair no próprio hub em vez de numa tela de erros. */

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, setoresDo, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export function GuardaExecutivo({ children }: { children: ReactNode }) {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  const liberado = !!dados && ehAdmin(dados);

  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresDo(dados), ehAdmin(dados));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!liberado) return <TelaCarregando />;
  return <>{children}</>;
}
