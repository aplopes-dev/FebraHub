"use client";

/* Guarda de UX das rotas fechadas: quem não tem a permissão é levado ao
   próprio hub em vez de encarar uma tela de 403 em pedaços.

   NÃO é segurança — a API recusa a requisição de qualquer forma, e é ela
   quem relê o perfil do banco. Aqui é só para a navegação fazer sentido.
   Aceita várias permissões: basta UMA (mesma regra do PermissaoGuard). */

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

export function GuardaPermissao({
  permissoes,
  children,
}: {
  permissoes: string[];
  children: ReactNode;
}) {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();
  const dados = perfil.data;
  const liberado = pode(dados, ...permissoes);

  useEffect(() => {
    if (!dados || liberado) return;
    const destino = hubInicial(setoresVisiveis(dados), pode(dados, "executivo.ver"));
    router.replace(destino ? `/${destino}` : "/");
  }, [dados, liberado, router]);

  if (!liberado) return <TelaCarregando />;
  return <>{children}</>;
}
