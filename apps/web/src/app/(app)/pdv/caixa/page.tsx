"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { FrentePdv } from "@/components/pdv/FrentePdv";

export default function Pagina() {
  return <GuardaPermissao permissoes={["pdv.operar"]}><FrentePdv /></GuardaPermissao>;
}
