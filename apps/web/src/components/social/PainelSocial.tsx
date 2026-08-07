"use client";

/* ============ REDES SOCIAIS (Zernio) ============
   Seis abas sobre uma integração só: acompanhar, publicar, revisar o que saiu,
   responder mensagem, olhar o dinheiro das campanhas e configurar.

   Por que abas e não seis telas: as cinco primeiras respondem à mesma pergunta
   ("como estão nossas redes?") e trocam de assunto o tempo todo — vi um post
   com engajamento baixo, quero ver a campanha que o impulsionou. Seis rotas
   fariam disso seis carregamentos.

   O recorte de acesso não é por setor: a conta do Zernio é uma só, das redes
   oficiais da Febracis Salvador. Quem decide é `social.ver` (abrir),
   `social.publicar` (publicar e responder) e `social.gerenciar` (configurar). */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Compass, KeyRound, MessageSquare, Megaphone, PenSquare } from "lucide-react";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { configSocial } from "@/services/api/social";
import { C, alfaDe } from "@/lib/tema";
import { AbaCampanhas } from "./AbaCampanhas";
import { AbaConfiguracao } from "./AbaConfiguracao";
import { AbaMensagens } from "./AbaMensagens";
import { AbaPostagens } from "./AbaPostagens";
import { AbaPublicar } from "./AbaPublicar";
import { AbaVisao } from "./AbaVisao";
import { SemChave } from "./SemChave";

type Aba = "visao" | "publicar" | "postagens" | "mensagens" | "campanhas" | "config";

const ABAS: { id: Aba; rotulo: string; Icone: typeof Compass; permissao?: string }[] = [
  { id: "visao", rotulo: "Visão geral", Icone: Compass },
  { id: "publicar", rotulo: "Publicar", Icone: PenSquare, permissao: "social.publicar" },
  { id: "postagens", rotulo: "Postagens e análise", Icone: BarChart3 },
  { id: "mensagens", rotulo: "Mensagens", Icone: MessageSquare },
  { id: "campanhas", rotulo: "Campanhas", Icone: Megaphone },
  { id: "config", rotulo: "Configuração", Icone: KeyRound, permissao: "social.gerenciar" },
];

export function PainelSocial() {
  const perfil = usePerfil(useSessao()).data ?? null;
  const [aba, setAba] = useState<Aba>("visao");

  const visiveis = ABAS.filter((a) => !a.permissao || pode(perfil, a.permissao));

  /* A configuração é a PRIMEIRA leitura: sem chave, as outras abas só
     mostrariam o mesmo erro cinco vezes. Sem ela, a tela manda direto para o
     lugar de resolver — ou explica quem pode resolver, para quem não pode. */
  const config = useQuery({ queryKey: ["social-config"], queryFn: configSocial, staleTime: 60_000 });

  if (config.isPending || (!config.data?.temChave && !config.isError)) {
    return (
      <SemChave
        carregando={config.isPending}
        podeConfigurar={pode(perfil, "social.gerenciar")}
        aoConfigurar={() => setAba("config")}
        mostrarConfig={aba === "config" && pode(perfil, "social.gerenciar")}
      >
        <AbaConfiguracao />
      </SemChave>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {visiveis.map((a) => (
          <button
            key={a.id}
            type="button"
            className="fh-exec-chip fh-toque"
            style={
              aba === a.id
                ? { color: C.gold, borderColor: alfaDe(C.gold, 0.5), background: alfaDe(C.gold, 0.08) }
                : undefined
            }
            onClick={() => setAba(a.id)}
            aria-pressed={aba === a.id}
          >
            <a.Icone size={12} style={{ marginRight: 5, verticalAlign: -2 }} />
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === "visao" && <AbaVisao aoPublicar={() => setAba("publicar")} />}
      {aba === "publicar" && <AbaPublicar aoPublicado={() => setAba("postagens")} />}
      {aba === "postagens" && <AbaPostagens />}
      {aba === "mensagens" && <AbaMensagens />}
      {aba === "campanhas" && <AbaCampanhas />}
      {aba === "config" && <AbaConfiguracao />}
    </div>
  );
}
