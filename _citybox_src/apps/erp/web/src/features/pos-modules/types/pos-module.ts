export type PosModuleState = "available" | "disabled" | "blocked";

export type PosModuleCatalogItem = {
  id: string;
  label: string;
  description: string;
};

export type PosModuleCatalog = {
  optional: PosModuleCatalogItem[];
  /** Só os ids: a tela não desenha o núcleo, só precisa não oferecê-lo. */
  coreIds: string[];
  profiles: string[];
};

export type PosModuleStateMap = Record<string, PosModuleState>;

export type PosModuleDefaults = {
  /** `null` quando o conjunto não corresponde mais a nenhum perfil. */
  profileName: string | null;
  modules: PosModuleStateMap;
  updatedAt: string;
  catalog: PosModuleCatalog;
};

export type TerminalModules = {
  terminalId: string;
  /** Já resolvido: padrão + sobrescrita, com núcleo forçado. */
  modules: PosModuleStateMap;
  /** `true` = segue o padrão da loja e acompanha as mudanças dele. */
  inheritsDefaults: boolean;
};

export function isModuleOn(
  modules: PosModuleStateMap,
  moduleId: string,
): boolean {
  return (modules[moduleId] ?? "available") === "available";
}

export function withModule(
  modules: PosModuleStateMap,
  moduleId: string,
  on: boolean,
): PosModuleStateMap {
  return { ...modules, [moduleId]: on ? "available" : "disabled" };
}
