"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

/** Rota antiga: a config das redes mora em Configurações → Redes sociais. */
export default function PaginaSocialRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/configuracoes/redes-sociais");
  }, [router]);
  return <TelaCarregando />;
}
