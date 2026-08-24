"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { lojaApagarCategoria, lojaAtualizarCategoria, lojaCategorias, lojaCriarCategoria } from "@/services/api/loja-produtos";
import { ErroApi } from "@/services/api/client";
import type { LojaCategoria } from "@/types/loja-produtos";

export function GestaoCategorias({ aoFechar }: { aoFechar: () => void }) {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const invalidar = () => qc.invalidateQueries({ queryKey: ["loja", "categorias"] });

  const criar = useMutation({
    mutationFn: () => lojaCriarCategoria({ nome, ordem: (cats.data?.length ?? 0) + 1 }),
    onSuccess: () => { setNome(""); invalidar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao criar."),
  });
  const apagar = useMutation({
    mutationFn: (id: string) => lojaApagarCategoria(id),
    onSuccess: invalidar,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao apagar."),
  });
  const alternar = useMutation({
    mutationFn: (c: LojaCategoria) => lojaAtualizarCategoria(c.id, { ...c, ativo: !c.ativo }),
    onSuccess: invalidar,
  });

  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Categorias</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input className="loja-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova categoria" onKeyDown={(e) => { if (e.key === "Enter" && nome) { setErro(null); criar.mutate(); } }} />
          <button className="loja-btn ouro" disabled={criar.isPending || !nome} onClick={() => { setErro(null); criar.mutate(); }}><Plus size={15} /></button>
        </div>
        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginBottom: 8 }}>{erro}</p>}
        <div className="loja-mov">
          {(cats.data ?? []).map((c) => (
            <div key={c.id} className="linha" style={{ alignItems: "center" }}>
              <div><b>{c.nome}</b> <small>ordem {c.ordem}</small></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className={`loja-badge ${c.ativo ? "on" : "off"}`} style={{ border: 0, cursor: "pointer" }} onClick={() => alternar.mutate(c)}>{c.ativo ? "ativa" : "inativa"}</button>
                <button className="loja-btn mini perigo" onClick={() => { setErro(null); apagar.mutate(c.id); }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {!cats.isLoading && !(cats.data ?? []).length && <p className="loja-empty">Nenhuma categoria.</p>}
        </div>
        <div className="fim"><button className="loja-btn" onClick={aoFechar}>Fechar</button></div>
      </div>
    </div>
  );
}
