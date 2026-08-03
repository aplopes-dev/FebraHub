"use client";

import { useCallback, useEffect, useState, type PointerEvent, type ReactNode } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";

const HANDLE_WIDTH = 10;
export const RAIL_WIDTH = 40;

function storageKeyFor(key: string): string {
  return `crm:conversas:${key}`;
}

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "1";
}

/** Estado de largura resizável + colapsado de um painel, persistido em localStorage. */
export function useResizablePanel(options: {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  defaultCollapsed?: boolean;
}) {
  const { storageKey, defaultWidth, minWidth, maxWidth } = options;
  const widthKey = storageKeyFor(`${storageKey}:width`);
  const collapsedKey = storageKeyFor(`${storageKey}:collapsed`);

  const [width, setWidth] = useState(() => readStoredNumber(widthKey, defaultWidth));
  const [collapsed, setCollapsed] = useState(() =>
    readStoredBoolean(collapsedKey, options.defaultCollapsed ?? false),
  );

  useEffect(() => {
    window.localStorage.setItem(widthKey, String(width));
  }, [widthKey, width]);

  useEffect(() => {
    window.localStorage.setItem(collapsedKey, collapsed ? "1" : "0");
  }, [collapsedKey, collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((current) => !current), []);
  const expand = useCallback(() => setCollapsed(false), []);

  return { width, setWidth, minWidth, maxWidth, collapsed, toggleCollapsed, expand };
}

/** Boolean simples persistido — usado pelo colapso da coluna de Mensagens (sem largura própria). */
export function usePersistedBoolean(key: string, defaultValue: boolean) {
  const fullKey = storageKeyFor(key);
  const [value, setValue] = useState(() => readStoredBoolean(fullKey, defaultValue));
  useEffect(() => {
    window.localStorage.setItem(fullKey, value ? "1" : "0");
  }, [fullKey, value]);
  return [value, setValue] as const;
}

type ResizeHandleProps = {
  width: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Lado onde fica o painel controlado por este handle, em relação a ele mesmo. */
  side: "left" | "right";
  ariaLabel: string;
};

/** Divisor vertical arrastável (redimensiona) com botão de recolher/expandir embutido. */
export function ResizeHandle({
  width,
  minWidth,
  maxWidth,
  onResize,
  collapsed,
  onToggleCollapse,
  side,
  ariaLabel,
}: ResizeHandleProps) {
  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (collapsed) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragStartX = String(startX);
      event.currentTarget.dataset.dragStartWidth = String(startWidth);
    },
    [collapsed, width],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const { dragStartX, dragStartWidth } = event.currentTarget.dataset;
      if (dragStartX === undefined || dragStartWidth === undefined) return;
      const rawDelta = event.clientX - Number(dragStartX);
      // side="left": o painel controlado fica à esquerda do handle — arrastar
      // p/ direita aumenta a largura. side="right": painel à direita —
      // arrastar p/ esquerda aumenta (delta invertido).
      const delta = side === "left" ? rawDelta : -rawDelta;
      const next = Math.min(
        maxWidth,
        Math.max(minWidth, Number(dragStartWidth) + delta),
      );
      onResize(next);
    },
    [side, minWidth, maxWidth, onResize],
  );

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    delete event.currentTarget.dataset.dragStartX;
    delete event.currentTarget.dataset.dragStartWidth;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // já liberado
    }
  }, []);

  const CollapseIcon = side === "left" ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        position: "relative",
        flexShrink: 0,
        width: HANDLE_WIDTH,
        height: "100%",
        cursor: collapsed ? "default" : "col-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        "&:hover .resize-grip": { bgcolor: "primary.main", opacity: 1 },
      }}
    >
      <Box
        className="resize-grip"
        aria-hidden
        sx={{
          width: 2,
          height: "100%",
          bgcolor: "divider",
          opacity: 0.7,
          transition: "background-color .15s, opacity .15s",
        }}
      />
      <Tooltip title={collapsed ? `Expandir ${ariaLabel}` : `Recolher ${ariaLabel}`}>
        <IconButton
          size="small"
          aria-label={collapsed ? `Expandir ${ariaLabel}` : `Recolher ${ariaLabel}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapse();
          }}
          sx={{
            position: "absolute",
            width: 22,
            height: 22,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 1,
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <CollapseIcon
            sx={{ fontSize: 16, transform: collapsed ? "rotate(180deg)" : "none" }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

type CollapsedRailProps = {
  label: string;
  icon: ReactNode;
  onExpand: () => void;
  /** Direção do chevron de expandir (aponta para onde o painel vai "abrir"). */
  expandDirection: "left" | "right";
};

/** Tira fina exibida no lugar de um painel recolhido, com botão para reabrir. */
export function CollapsedRail({
  label,
  icon,
  onExpand,
  expandDirection,
}: CollapsedRailProps) {
  const ExpandIcon = expandDirection === "right" ? ChevronRightIcon : ChevronLeftIcon;
  return (
    <Box
      sx={{
        height: "100%",
        width: RAIL_WIDTH,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        pt: 1.5,
        bgcolor: "background.paper",
        borderRadius: "8px",
      }}
    >
      <Tooltip title={`Expandir ${label}`}>
        <IconButton size="small" aria-label={`Expandir ${label}`} onClick={onExpand}>
          <ExpandIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Typography
        variant="caption"
        sx={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          color: "text.secondary",
          fontWeight: 700,
          letterSpacing: "0.05em",
          mt: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
