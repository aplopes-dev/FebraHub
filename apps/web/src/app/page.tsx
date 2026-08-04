"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SemPerfil } from "@/components/shell/SemPerfil";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { ehAdmin, pode, setoresVisiveis, usePerfil, useSessao } from "@/hooks/auth";
import { hubInicial } from "@/lib/hubs";

/* Porta de entrada: decide entre o Login e o Shell conforme a sessão.
   Não existe um "/" com conteúdo próprio — cada hub tem URL, e a raiz só
   escolhe qual delas abrir (Executivo pra diretoria, o primeiro setor
   disponível para os demais). */
export default function Raiz() {
  const sessao = useSessao();
  const perfil = usePerfil(sessao);
  const router = useRouter();

  const dados = perfil.data;

  useEffect(() => {
    if (sessao === undefined) return;
    if (!sessao) { router.replace("/login"); return; }
    if (!dados) return;
    const destino = hubInicial(setoresVisiveis(dados), pode(dados, "executivo.ver"));
    if (destino) router.replace(`/${destino}`);
  }, [sessao, dados, router]);

  // Perfil sem setor nenhum: não há hub pra abrir. Mesma tela de cadastro
  // incompleto, em vez de um redirecionamento em círculo.
  if (sessao && !perfil.isLoading && (perfil.error || !dados)) return <SemPerfil />;
  if (sessao && dados && !hubInicial(setoresVisiveis(dados), pode(dados, "executivo.ver"))) return <SemPerfil />;

  return <TelaCarregando />;
}
