"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Pagina() {
  const router = useRouter();
  useEffect(() => { router.replace("/pdv-movel/vender"); }, [router]);
  return <div className="pm-center">Abrindo o PDV…</div>;
}
