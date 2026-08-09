"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { FormCrud } from "./FormCrud";
import { TabelaCrud } from "./TabelaCrud";
import type { CampoCrud, ColunaCrud, ListaCrud } from "./tipos";
import { BOTAO_OURO, BOTAO_SECUNDARIO, inputAv } from "@/components/ui/estilos";
import { C, SANS } from "@/lib/tema";

export function PaginaCrud<T extends object>({
  colunas,
  campos,
  carregar,
  salvar,
  apagar,
  chaveLinha,
  tituloNovo,
  tituloEditar,
  valoresDe,
  filtroExtra,
  acoesExtras,
}: {
  colunas: ColunaCrud<T>[];
  campos: CampoCrud[];
  carregar: (pagina: number, filtro: Record<string, string>) => Promise<ListaCrud<T>>;
  salvar: (valores: Record<string, unknown>, editando: T | null) => Promise<void>;
  apagar: (row: T) => Promise<void>;
  chaveLinha: (row: T) => string | number;
  tituloNovo: string;
  tituloEditar: string;
  valoresDe: (row: T) => Record<string, unknown>;
  filtroExtra?: ReactNode;
  /** Slot à esquerda do botão Novo (ex.: Importar). */
  acoesExtras?: ReactNode;
}) {
  const [pagina, setPagina] = useState(1);
  const [filtroMes, setFiltroMes] = useState("");
  const [lista, setLista] = useState<ListaCrud<T> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<T | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const filtro: Record<string, string> = {};
      if (filtroMes) filtro.mes = `${filtroMes}-01`;
      const data = await carregar(pagina, filtro);
      setLista(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [carregar, pagina, filtroMes]);

  useEffect(() => { void recarregar(); }, [recarregar]);

  const totalPaginas = lista ? Math.max(1, Math.ceil(lista.total / lista.por_pagina)) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
            Mês
            <input
              type="month"
              value={filtroMes}
              onChange={(e) => { setPagina(1); setFiltroMes(e.target.value); }}
              style={{ ...inputAv, width: 160, marginLeft: 8, display: "inline-block" }}
            />
          </label>
          {filtroMes && (
            <button
              type="button"
              style={{ ...BOTAO_SECUNDARIO, padding: "6px 12px" }}
              onClick={() => { setFiltroMes(""); setPagina(1); }}
            >
              Limpar
            </button>
          )}
          {filtroExtra}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {acoesExtras}
          <button
            type="button"
            style={BOTAO_OURO}
            onClick={() => { setEditando(null); setErroForm(null); setAberto(true); }}
          >
            <Plus size={14} /> Novo
          </button>
        </div>
      </div>

      {erro && <div style={{ color: C.down, fontSize: 13 }}>{erro}</div>}
      {carregando && !lista ? (
        <div style={{ color: C.faint, fontSize: 13, padding: 24 }}>Carregando…</div>
      ) : (
        <TabelaCrud
          colunas={colunas}
          linhas={lista?.itens ?? []}
          chaveLinha={chaveLinha}
          onEditar={(row) => { setEditando(row); setErroForm(null); setAberto(true); }}
          onApagar={async (row) => {
            if (!confirm("Apagar este registro?")) return;
            try {
              await apagar(row);
              await recarregar();
            } catch (e) {
              alert(e instanceof Error ? e.message : "Falha ao apagar");
            }
          }}
          rodape={lista && (
            <>
              <span style={{ fontFamily: SANS }}>
                {lista.total} registro{lista.total === 1 ? "" : "s"}
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  type="button"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  style={{ ...BOTAO_SECUNDARIO, padding: "5px 8px", opacity: pagina <= 1 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span>{pagina} / {totalPaginas}</span>
                <button
                  type="button"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  style={{ ...BOTAO_SECUNDARIO, padding: "5px 8px", opacity: pagina >= totalPaginas ? 0.4 : 1 }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        />
      )}

      <FormCrud
        titulo={editando ? tituloEditar : tituloNovo}
        campos={campos}
        valoresIniciais={editando ? valoresDe(editando) : undefined}
        aberto={aberto}
        onFechar={() => setAberto(false)}
        salvando={salvando}
        erro={erroForm}
        onSalvar={async (valores) => {
          setSalvando(true);
          setErroForm(null);
          try {
            await salvar(valores, editando);
            setAberto(false);
            await recarregar();
          } catch (e) {
            setErroForm(e instanceof Error ? e.message : "Falha ao salvar");
          } finally {
            setSalvando(false);
          }
        }}
      />
    </div>
  );
}
