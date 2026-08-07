import { api } from "./client";
import type { AnotacaoParaGravar, AvaliacaoParaGravar, RetencaoParaGravar } from "@/types/views";

/* ============================================================
   ESCRITA (exceção sancionada ao "front só lê view")

   As tabelas fato_avaliacao, maestro_anotacao e fato_retencao são
   alimentadas à mão pelo pedagógico. A gravação vai com o cookie de sessão;
   a API barra quem não for do setor (403), exatamente como as policies de
   INSERT/UPDATE com `pode_ver('pedagogico')` faziam. Erros sobem pro form
   tratar — nada é engolido aqui.
   ============================================================ */

export async function salvarAvaliacao(registro: AvaliacaoParaGravar): Promise<void> {
  await api.post<void>("/pedagogico/avaliacoes", registro);
}

/** Upsert por `aluno_id` (= CPF do maestro): o PUT é idempotente, então
 *  editar duas vezes a mesma ficha não cria duas linhas. */
export async function salvarMaestroAnotacao(anotacao: AnotacaoParaGravar): Promise<void> {
  await api.put<void>(`/pedagogico/maestros/${encodeURIComponent(anotacao.aluno_id)}/anotacao`, anotacao);
}

/** Sem `id` insere um caso novo; com `id` atualiza (ex.: mudar o desfecho de
 *  'pendente' para 'retido'/'cancelado' depois da ligação). */
export async function salvarRetencao(registro: RetencaoParaGravar): Promise<void> {
  const { id, ...campos } = registro;
  if (id != null) await api.put<void>(`/pedagogico/retencao/${id}`, campos);
  else await api.post<void>("/pedagogico/retencao", campos);
}
