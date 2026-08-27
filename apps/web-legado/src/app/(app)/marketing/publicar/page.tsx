"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { GuardaSocial } from "@/components/social/GuardaSocial";
import { AbaPublicar } from "@/components/social/AbaPublicar";
import { TelaCarregando } from "@/components/shell/TelaCarregando";

export default function PaginaPublicarRedes() {
  const router = useRouter();
  return (
    <GuardaPermissao permissoes={["social.publicar"]}>
      <Suspense fallback={<TelaCarregando />}>
        <GuardaSocial>
          <AbaPublicar aoPublicado={() => router.push("/marketing/postagens")} />
        </GuardaSocial>
      </Suspense>
    </GuardaPermissao>
  );
}
