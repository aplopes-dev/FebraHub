"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import InputBase from "@mui/material/InputBase";
import { alpha } from "@mui/material/styles";
import { Icon } from "../../icons/icon";
import { Dialog } from "../../atoms/dialog";
import { IconButton } from "../../atoms/icon-button";
import { Kbd } from "../../atoms/kbd";
import { Typography } from "../../atoms/typography";
import { ScrollArea } from "../../molecules/scroll-area";

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  icon?: React.ReactNode;
  onSelect: () => void;
};

export type CommandPaletteGroup = {
  heading: string;
  items: CommandPaletteItem[];
};

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandPaletteGroup[];
  title?: string;
  description?: string;
  placeholder?: string;
  emptyMessage?: string;
  /** Atalho global (meta/ctrl + key). Default: "k". Pass `null` para desabilitar. */
  shortcutKey?: string | null;
  /** Input controlado (busca assíncrona no pai). */
  query?: string;
  onQueryChange?: (query: string) => void;
  /**
   * `local` (default): filtra `groups` pelo texto do input.
   * `external`: exibe `groups` como vieram (pai já filtrou via API).
   */
  filterMode?: "local" | "external";
  loading?: boolean;
  loadingMessage?: string;
};

/** Acessível ao leitor de tela, invisível na tela. */
const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(item: CommandPaletteItem, query: string) {
  if (!query) return true;
  const haystack = [
    item.label,
    item.description ?? "",
    ...(item.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function CommandPalette({
  open,
  onOpenChange,
  groups,
  title = "Busca",
  description,
  placeholder = "Digite para buscar…",
  emptyMessage = "Nenhum resultado encontrado.",
  shortcutKey = "k",
  query: queryProp,
  onQueryChange,
  filterMode = "local",
  loading = false,
  loadingMessage = "Buscando…",
}: CommandPaletteProps) {
  const [uncontrolledQuery, setUncontrolledQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<(HTMLElement | null)[]>([]);

  const isControlled = queryProp !== undefined;
  const query = isControlled ? queryProp : uncontrolledQuery;

  const setQuery = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledQuery(next);
      }
      onQueryChange?.(next);
    },
    [isControlled, onQueryChange],
  );

  const normalizedQuery = normalizeSearch(query);

  const filteredGroups =
    filterMode === "external"
      ? groups.filter((group) => group.items.length > 0)
      : groups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
              matchesQuery(item, normalizedQuery),
            ),
          }))
          .filter((group) => group.items.length > 0);

  /** Ordem de teclado: os grupos achatados em uma lista só. */
  const flatItems = filteredGroups.flatMap((group) => group.items);
  const hasResults = flatItems.length > 0;

  const indexById = React.useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach((item, index) => map.set(item.id, index));
    return map;
    // `flatItems` é recriado a cada render; a identidade que importa é a lista de ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatItems.map((item) => item.id).join("|")]);

  React.useEffect(() => {
    if (!open) {
      if (!isControlled) {
        setUncontrolledQuery("");
      }
      return;
    }
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, isControlled]);

  /** Texto novo ⇒ o destaque volta para o primeiro resultado. */
  React.useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  /** Lista encurtou (filtro/API) ⇒ não deixa o índice apontar para o vazio. */
  React.useEffect(() => {
    setActiveIndex((current) =>
      current > flatItems.length - 1 ? Math.max(flatItems.length - 1, 0) : current,
    );
  }, [flatItems.length]);

  React.useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  React.useEffect(() => {
    if (shortcutKey == null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === shortcutKey.toLowerCase()
      ) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange, shortcutKey]);

  const runItem = (item: CommandPaletteItem) => {
    onOpenChange(false);
    item.onSelect();
  };

  /** Setas/Enter navegam sem tirar o foco do input. */
  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (!hasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatItems.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + flatItems.length) % flatItems.length,
      );
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(flatItems.length - 1);
      return;
    }
    if (event.key === "Enter") {
      const item = flatItems[activeIndex];
      if (item) {
        event.preventDefault();
        runItem(item);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
      aria-labelledby="command-palette-title"
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: (theme) =>
              alpha(
                theme.palette.common.black,
                theme.palette.mode === "dark" ? 0.55 : 0.28,
              ),
            backdropFilter: "blur(4px)",
          },
        },
        paper: {
          sx: (theme) => ({
            mt: { xs: 1.5, sm: "14vh" },
            mb: 2,
            mx: { xs: 1.5, sm: 2 },
            width: "100%",
            borderRadius: 2.5,
            overflow: "hidden",
            maxHeight: { xs: "calc(100% - 24px)", sm: "min(520px, 72vh)" },
            border: "1px solid",
            borderColor: "divider",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 24px 48px rgba(0, 0, 0, 0.45)"
                : "0 24px 48px rgba(15, 23, 42, 0.14), 0 8px 16px rgba(15, 23, 42, 0.06)",
          }),
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "flex-start",
        },
      }}
    >
      <Box component="h2" id="command-palette-title" sx={srOnly}>
        {title}
      </Box>
      {description ? <Box sx={srOnly}>{description}</Box> : null}

      <Box
        onKeyDown={onListKeyDown}
        sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {/* Cabeçalho: o próprio input é o título do diálogo. */}
        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.5,
            flexShrink: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.text.primary, 0.015),
          })}
        >
          <Icon
            name="search"
            variant="linear"
            size={20}
            sx={{ color: "text.disabled", flexShrink: 0 }}
            aria-hidden
          />
          <InputBase
            inputRef={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            fullWidth
            inputProps={{
              "aria-label": title,
              "aria-controls": "command-palette-results",
              autoComplete: "off",
              spellCheck: false,
            }}
            sx={{
              fontSize: "0.9375rem",
              letterSpacing: "0.005em",
              "& input::placeholder": {
                color: "text.disabled",
                opacity: 1,
              },
            }}
          />
          {loading ? (
            <CircularProgress size={16} sx={{ flexShrink: 0, mr: 0.5 }} />
          ) : null}
          {query ? (
            <IconButton
              size="small"
              aria-label="Limpar busca"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              sx={{
                width: 28,
                height: 28,
                flexShrink: 0,
                color: "text.disabled",
                "&:hover": { color: "text.secondary" },
              }}
            >
              <Icon name="close" variant="linear" size={14} />
            </IconButton>
          ) : (
            <Kbd
              sx={{
                flexShrink: 0,
                height: 22,
                px: 0.875,
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              esc
            </Kbd>
          )}
        </Box>

        <ScrollArea
          id="command-palette-results"
          sx={{ flex: 1, px: 1.25, py: 1.25, minHeight: 180 }}
        >
          {loading && !hasResults ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {loadingMessage}
              </Typography>
            </Box>
          ) : !hasResults ? (
            <Box
              sx={{
                py: 6,
                px: 2,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Box
                sx={(theme) => ({
                  display: "grid",
                  placeItems: "center",
                  width: 44,
                  height: 44,
                  mb: 0.5,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  color: "text.disabled",
                })}
              >
                <Icon name="search" variant="linear" size={22} aria-hidden />
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "text.primary" }}
              >
                {emptyMessage}
              </Typography>
              {normalizedQuery ? (
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  Nada para “{query.trim()}”.
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  Tente um módulo, produto ou cliente.
                </Typography>
              )}
            </Box>
          ) : (
            filteredGroups.map((group) => (
              <Box
                key={group.heading}
                sx={{ "&:not(:first-of-type)": { mt: 1.25 } }}
              >
                <Typography
                  component="div"
                  sx={{
                    px: 1.25,
                    pt: 0.5,
                    pb: 0.75,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "text.disabled",
                  }}
                >
                  {group.heading}
                </Typography>

                {group.items.map((item) => {
                  const index = indexById.get(item.id) ?? -1;
                  const active = index === activeIndex;

                  return (
                    <ButtonBase
                      key={item.id}
                      ref={(node: HTMLButtonElement | null) => {
                        itemRefs.current[index] = node;
                      }}
                      disableRipple
                      onClick={() => runItem(item)}
                      onMouseMove={() => {
                        if (index >= 0 && index !== activeIndex) {
                          setActiveIndex(index);
                        }
                      }}
                      aria-selected={active}
                      sx={(theme) => ({
                        width: "100%",
                        justifyContent: "flex-start",
                        gap: 1.25,
                        px: 1.25,
                        py: 1.125,
                        mb: 0.25,
                        borderRadius: 1.5,
                        textAlign: "left",
                        color: "text.primary",
                        transition: theme.transitions.create(
                          ["background-color", "color", "box-shadow"],
                          { duration: 100 },
                        ),
                        ...(active && {
                          bgcolor: alpha(theme.palette.primary.main, 0.09),
                          boxShadow: `inset 0 0 0 1px ${alpha(
                            theme.palette.primary.main,
                            0.18,
                          )}`,
                        }),
                      })}
                    >
                      <Box
                        aria-hidden
                        sx={(theme) => ({
                          display: "grid",
                          placeItems: "center",
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          borderRadius: 1.25,
                          bgcolor: active
                            ? alpha(theme.palette.primary.main, 0.16)
                            : alpha(theme.palette.text.primary, 0.05),
                          color: active ? "primary.main" : "text.secondary",
                          transition: theme.transitions.create(
                            ["background-color", "color"],
                            { duration: 100 },
                          ),
                          "& svg": { fontSize: 16 },
                        })}
                      >
                        {item.icon ?? (
                          <Icon
                            name="chevron-right"
                            variant="linear"
                            size={14}
                          />
                        )}
                      </Box>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            fontWeight: 500,
                            lineHeight: 1.35,
                            color: active ? "primary.main" : "text.primary",
                          }}
                        >
                          {item.label}
                        </Typography>
                        {item.description ? (
                          <Typography
                            variant="caption"
                            noWrap
                            component="div"
                            sx={{
                              mt: 0.125,
                              color: "text.secondary",
                              lineHeight: 1.3,
                            }}
                          >
                            {item.description}
                          </Typography>
                        ) : null}
                      </Box>

                      {active ? (
                        <Kbd
                          sx={{
                            flexShrink: 0,
                            height: 22,
                            bgcolor: "transparent",
                            borderColor: (theme) =>
                              alpha(theme.palette.primary.main, 0.25),
                            color: "primary.main",
                          }}
                        >
                          ↵
                        </Kbd>
                      ) : null}
                    </ButtonBase>
                  );
                })}
              </Box>
            ))
          )}
        </ScrollArea>

        {/* Rodapé de atalhos — ensina a navegar sem o mouse. */}
        <Box
          sx={(theme) => ({
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            gap: 2,
            px: 2,
            py: 1.125,
            flexShrink: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.text.primary, 0.02),
          })}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              navegar
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Kbd>↵</Kbd>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              abrir
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Kbd sx={{ px: 0.875 }}>esc</Kbd>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              fechar
            </Typography>
          </Box>
          {hasResults ? (
            <Typography
              variant="caption"
              sx={{ ml: "auto", color: "text.disabled", fontVariantNumeric: "tabular-nums" }}
            >
              {flatItems.length}{" "}
              {flatItems.length === 1 ? "resultado" : "resultados"}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Dialog>
  );
}
