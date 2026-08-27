"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { BalcaoPdv } from "@/components/loja/BalcaoPdv";

/** Largura abaixo da qual o PDV de balcão (desenhado para caixa/desktop) fica
 *  apertado demais — nesse caso mandamos o operador para o PDV móvel. */
const LIMITE_MOBILE = 820;

export default function Pagina() {
  const router = useRouter();
  const [redirecionando, setRedirecionando] = useState(false);

  useEffect(() => {
    const ehCelular = () =>
      typeof window !== "undefined" &&
      (window.innerWidth < LIMITE_MOBILE ||
        window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches);
    if (ehCelular()) {
      setRedirecionando(true);
      router.replace("/pdv-movel/vender");
    }
  }, [router]);

  if (redirecionando) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "50vh", color: "var(--muted)", fontSize: 14 }}>
        Abrindo o PDV móvel…
      </div>
    );
  }

  return (
    <GuardaPermissao permissoes={["loja.pedidos.operar"]}>
      <BalcaoPdv />
    </GuardaPermissao>
  );
}
