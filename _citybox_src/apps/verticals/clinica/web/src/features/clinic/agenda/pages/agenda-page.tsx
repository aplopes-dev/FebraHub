"use client";

import { ClientContainer } from "../components/client-container";

/**
 * Página principal da Agenda da vertical clínica.
 *
 * Clone da Agenda do OdontoTech rodando 100% com dados mockados
 * (sem backend). Inclui as visões de calendário (dia/semana/mês/ano/agenda),
 * gestão de encaixe e alerta de retorno. O `ClientContainer` já renderiza o
 * cabeçalho da agenda; os providers ficam no `layout.tsx` da rota.
 */
export function ClinicAgendaPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4 p-4">
      <ClientContainer />
    </div>
  );
}
