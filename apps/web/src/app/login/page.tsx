"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Login } from "@/components/shell/Login";
import { TelaCarregando } from "@/components/shell/TelaCarregando";
import { useSessao } from "@/hooks/auth";

/** Tela de entrada. Quem já tem sessão válida não vê o formulário — vai
 *  direto pro `/`, que resolve qual hub abrir. */
export default function PaginaLogin() {
  const sessao = useSessao();
  const router = useRouter();

  useEffect(() => {
    if (sessao) router.replace("/");
  }, [sessao, router]);

  if (sessao === undefined || sessao) return <TelaCarregando />;
  return <Login />;
}
