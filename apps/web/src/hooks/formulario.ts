"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useFecharComEsc — o `useEffect` de "fecha no Escape" que os drawers de CRM e
 * territorial copiavam um a um. Passe `ativo` (ex.: `!!id`) para só ouvir quando
 * o painel está aberto.
 */
export function useFecharComEsc(aoFechar: () => void, ativo = true): void {
  useEffect(() => {
    if (!ativo) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar, ativo]);
}

/**
 * useModalFormulario — o boilerplate de "abrir/editar/fechar + salvando + erro +
 * salvar→fechar→recarregar" que quase toda tela de CRUD reimplementava à mão
 * (aberto/editando/salvando/erro + reset). Ver PaginaCrud, que fazia isto inline.
 *
 *   const form = useModalFormulario<Fornecedor>();
 *   form.abrirNovo(); form.abrirEdicao(row); form.fechar();
 *   await form.submeter(async () => { await salvar(...); await recarregar(); });
 */
export function useModalFormulario<T>() {
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<T | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const abrirNovo = useCallback(() => {
    setEditando(null);
    setErro(null);
    setAberto(true);
  }, []);

  const abrirEdicao = useCallback((item: T) => {
    setEditando(item);
    setErro(null);
    setAberto(true);
  }, []);

  const fechar = useCallback(() => {
    setAberto(false);
    setErro(null);
  }, []);

  /** Roda a operação, tratando salvando/erro; fecha o form ao concluir. */
  const submeter = useCallback(async (operacao: () => Promise<void>) => {
    setSalvando(true);
    setErro(null);
    try {
      await operacao();
      setAberto(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }, []);

  return { aberto, editando, salvando, erro, setErro, abrirNovo, abrirEdicao, fechar, submeter };
}

/**
 * useConfirmacao — o par "alvo + confirmar + carregando" do ModalConfirmar, para
 * exclusões e ações destrutivas. Guarda o item alvo e o estado de execução.
 *
 *   const del = useConfirmacao<Fornecedor>();
 *   <button onClick={() => del.pedir(row)} /> …
 *   {del.alvo && <ModalConfirmar carregando={del.carregando}
 *     onConfirmar={() => del.executar((row) => apagar(row))} onFechar={del.fechar} />}
 */
export function useConfirmacao<T>() {
  const [alvo, setAlvo] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const pedir = useCallback((item: T) => {
    setAlvo(item);
    setErro(null);
  }, []);

  const fechar = useCallback(() => {
    setAlvo(null);
    setErro(null);
  }, []);

  const executar = useCallback(async (operacao: (alvo: T) => Promise<void>) => {
    if (alvo == null) return;
    setCarregando(true);
    setErro(null);
    try {
      await operacao(alvo);
      setAlvo(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na operação.");
    } finally {
      setCarregando(false);
    }
  }, [alvo]);

  return { alvo, carregando, erro, pedir, fechar, executar };
}
