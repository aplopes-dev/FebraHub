"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  PosModuleDefaults,
  PosModuleStateMap,
  TerminalModules,
} from "@/features/pos-modules/types/pos-module";

type DefaultsResponseDto = { data: PosModuleDefaults };
type TerminalResponseDto = { data: TerminalModules };

/** Nunca 404: a API cria o padrão neutro na primeira leitura. */
export async function getPosModuleDefaults(): Promise<PosModuleDefaults> {
  const response = await comercioFetch<DefaultsResponseDto>(
    "/v1/pos-module-defaults",
  );
  return response.data;
}

export async function savePosModuleDefaults(input: {
  applyProfile?: string;
  modules?: PosModuleStateMap;
}): Promise<PosModuleDefaults> {
  const response = await comercioFetch<DefaultsResponseDto>(
    "/v1/pos-module-defaults",
    { method: "PUT", body: JSON.stringify(input) },
  );
  return response.data;
}

export async function getTerminalModules(
  terminalId: string,
): Promise<TerminalModules> {
  const response = await comercioFetch<TerminalResponseDto>(
    `/v1/pos-terminals/${terminalId}/modules`,
  );
  return response.data;
}

/**
 * `modules: null` faz o terminal **voltar a herdar**.
 *
 * O parâmetro é obrigatório de propósito: um default omitindo o campo tornaria
 * "não mexi" e "quero herdar" a mesma chamada, e a diferença é justamente o que
 * a herança precisa.
 */
export async function saveTerminalModules(
  terminalId: string,
  modules: PosModuleStateMap | null,
): Promise<TerminalModules> {
  const response = await comercioFetch<TerminalResponseDto>(
    `/v1/pos-terminals/${terminalId}/modules`,
    { method: "PUT", body: JSON.stringify({ modules }) },
  );
  return response.data;
}
