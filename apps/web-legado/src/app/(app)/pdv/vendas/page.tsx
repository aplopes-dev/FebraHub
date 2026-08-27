"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { VendasPdv } from "@/components/pdv/VendasPdv";

export default function Pagina() {
  return <GuardaPermissao permissoes={["pdv.ver"]}><VendasPdv /></GuardaPermissao>;
}
