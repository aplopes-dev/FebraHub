"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useLayoutBreakpoints,
  type ShellLayoutMode,
} from "./layout-breakpoints";

type ShellLayoutContextValue = {
  mode: ShellLayoutMode;
  isMobile: boolean;
  isCompact: boolean;
  isDesktop: boolean;
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
};

const ShellLayoutContext = createContext<ShellLayoutContextValue | null>(null);

export function ShellLayoutProvider({ children }: { children: ReactNode }) {
  const breakpoints = useLayoutBreakpoints();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const toggleMobileNav = useCallback(
    () => setMobileNavOpen((open) => !open),
    [],
  );

  useEffect(() => {
    if (!breakpoints.isMobile && mobileNavOpen) {
      setMobileNavOpen(false);
    }
  }, [breakpoints.isMobile, mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNav();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeMobileNav, mobileNavOpen]);

  const value = useMemo<ShellLayoutContextValue>(
    () => ({
      ...breakpoints,
      mobileNavOpen,
      openMobileNav,
      closeMobileNav,
      toggleMobileNav,
    }),
    [breakpoints, closeMobileNav, mobileNavOpen, openMobileNav, toggleMobileNav],
  );

  return (
    <ShellLayoutContext.Provider value={value}>
      {children}
    </ShellLayoutContext.Provider>
  );
}

export function useShellLayout() {
  const context = useContext(ShellLayoutContext);
  if (!context) {
    throw new Error("useShellLayout must be used within ShellLayoutProvider");
  }
  return context;
}
