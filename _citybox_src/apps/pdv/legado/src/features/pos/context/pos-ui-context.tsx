'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ALL_MENUS_ID, type CatalogMenuId } from '../types/catalog-menu';
import type { OrderFulfillmentType } from '../types/order-fulfillment';
import type { PosUiState } from '../types/pos-ui';

type PosUiContextValue = PosUiState & {
  setSearchQuery: (query: string) => void;
  setActiveCatalogMenuId: (menuId: CatalogMenuId) => void;
  setOrderFulfillment: (fulfillment: OrderFulfillmentType) => void;
  openSideMenu: () => void;
  closeSideMenu: () => void;
  toggleSideMenu: () => void;
};

const PosUiContext = createContext<PosUiContextValue | null>(null);

const INITIAL_STATE: PosUiState = {
  searchQuery: '',
  isSideMenuOpen: false,
  activeCatalogMenuId: ALL_MENUS_ID,
  orderFulfillment: 'dine_in',
};

export function PosUiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PosUiState>(INITIAL_STATE);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const setActiveCatalogMenuId = useCallback((activeCatalogMenuId: CatalogMenuId) => {
    setState((prev) => ({ ...prev, activeCatalogMenuId }));
  }, []);

  const setOrderFulfillment = useCallback((orderFulfillment: OrderFulfillmentType) => {
    setState((prev) => ({ ...prev, orderFulfillment }));
  }, []);

  const openSideMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isSideMenuOpen: true }));
  }, []);

  const closeSideMenu = useCallback(() => {
    setState((prev) => ({ ...prev, isSideMenuOpen: false }));
  }, []);

  const toggleSideMenu = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSideMenuOpen: !prev.isSideMenuOpen,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setSearchQuery,
      setActiveCatalogMenuId,
      setOrderFulfillment,
      openSideMenu,
      closeSideMenu,
      toggleSideMenu,
    }),
    [
      state,
      setSearchQuery,
      setActiveCatalogMenuId,
      setOrderFulfillment,
      openSideMenu,
      closeSideMenu,
      toggleSideMenu,
    ],
  );

  return (
    <PosUiContext.Provider value={value}>{children}</PosUiContext.Provider>
  );
}

export function usePosUi(): PosUiContextValue {
  const ctx = useContext(PosUiContext);
  if (!ctx) {
    throw new Error('usePosUi deve ser usado dentro de PosUiProvider');
  }
  return ctx;
}
