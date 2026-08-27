"use client";

import type { ReactNode } from "react";

/**
 * CabecalhoPagina — cabeçalho padrão de tela de feature: título + descrição
 * (ou trilha) à esquerda e um slot de AÇÕES à direita.
 *
 * Padroniza o que dezenas de telas reimplementavam à mão (um flex com <h1> +
 * <p> + botões, cada uma com estilos inline próprios). Inspirado no PageHeader
 * do DMS de referência (docs/references/concessionaria), mas escrito nos tokens
 * e classes do FebraHub (`.fh-page-*`) — mantém a identidade Febracis (dourado,
 * tema claro/escuro) e reage aos mesmos temas do resto do app.
 *
 * Uso:
 *   <CabecalhoPagina
 *     titulo="Fornecedores"
 *     descricao="Cadastro único referenciado por cotações e pedidos"
 *     acoes={<button className="fh-btn-ouro">Novo fornecedor</button>}
 *   />
 */
export function CabecalhoPagina({
  titulo,
  descricao,
  trilha,
  eyebrow,
  acoes,
}: {
  titulo: ReactNode;
  /** Linha de apoio abaixo do título. Ignorada se `trilha` for passada. */
  descricao?: ReactNode;
  /** Trilha de navegação (breadcrumb); tem precedência sobre `descricao`. */
  trilha?: ReactNode;
  /** Rótulo pequeno acima do título (dourado, caixa alta) — ex.: seção/módulo. */
  eyebrow?: ReactNode;
  /** Slot à direita — botões de ação. */
  acoes?: ReactNode;
}) {
  return (
    <div className="fh-page-topo">
      <div style={{ minWidth: 0 }}>
        {eyebrow != null && <div className="fh-page-data">{eyebrow}</div>}
        <h1 className="fh-page-titulo">{titulo}</h1>
        {trilha != null ? (
          <div style={{ marginTop: 6 }}>{trilha}</div>
        ) : descricao != null ? (
          <div className="fh-page-desc">{descricao}</div>
        ) : null}
      </div>
      {acoes != null && <div className="fh-page-acoes">{acoes}</div>}
    </div>
  );
}
