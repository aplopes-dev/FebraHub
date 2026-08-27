"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_ICON_VARIANT,
  type IconVariant,
} from "./registry";

export type IconsContextValue = {
  /** Estilo Solar padrão do app (pode ser sobrescrito por ícone). */
  variant: IconVariant;
};

const IconsContext = createContext<IconsContextValue>({
  variant: DEFAULT_ICON_VARIANT,
});

export type IconsProviderProps = {
  /** Estilo padrão para todos os `<Icon />` filhos. Default: `linear`. */
  variant?: IconVariant;
  children: ReactNode;
};

/**
 * Define o `variant` padrão dos ícones no app (ou em um subárvore).
 *
 * @example
 * <IconsProvider variant="bold">
 *   <App />
 * </IconsProvider>
 */
export function IconsProvider({
  variant = DEFAULT_ICON_VARIANT,
  children,
}: IconsProviderProps) {
  return (
    <IconsContext.Provider value={{ variant }}>
      {children}
    </IconsContext.Provider>
  );
}

export function useIconsContext(): IconsContextValue {
  return useContext(IconsContext);
}
