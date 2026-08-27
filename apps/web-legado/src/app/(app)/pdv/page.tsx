"use client";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { ResumoPdv } from "@/components/pdv/ResumoPdv";

export default function Pagina() {
  return <GuardaPermissao permissoes={["pdv.ver"]}><ResumoPdv /></GuardaPermissao>;
}
