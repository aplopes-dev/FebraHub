"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import { Icon } from "../../icons/icon";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../../atoms/dialog";
import { Input } from "../../atoms/input";
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
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const hasResults = filteredGroups.length > 0;

  React.useEffect(() => {
    if (!open) {
      if (!isControlled) {
        setUncontrolledQuery("");
      }
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, isControlled]);

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

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
      aria-labelledby="command-palette-title"
    >
      <DialogTitle id="command-palette-title" sx={{ pb: 1 }}>
        {title}
      </DialogTitle>
      {description ? (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", px: 3, pb: 1 }}
        >
          {description}
        </Typography>
      ) : null}
      <DialogContent sx={{ pt: 0, pb: 2 }}>
        <Input
          inputRef={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon name="search" variant="linear" size={18} />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        <ScrollArea sx={{ mt: 1.5, maxHeight: 360 }}>
          {loading && !hasResults ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {loadingMessage}
              </Typography>
            </Box>
          ) : !hasResults ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {emptyMessage}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredGroups.map((group) => (
                <React.Fragment key={group.heading}>
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: "transparent",
                      lineHeight: 2,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "text.secondary",
                      px: 1,
                    }}
                  >
                    {group.heading}
                  </ListSubheader>
                  {group.items.map((item) => (
                    <ListItemButton
                      key={item.id}
                      onClick={() => {
                        onOpenChange(false);
                        item.onSelect();
                      }}
                      sx={{ borderRadius: 1, gap: 1 }}
                    >
                      {item.icon ? (
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {item.icon}
                        </ListItemIcon>
                      ) : null}
                      <ListItemText
                        primary={item.label}
                        secondary={item.description}
                        slotProps={{
                          primary: { noWrap: true },
                          secondary: { noWrap: true },
                        }}
                      />
                    </ListItemButton>
                  ))}
                </React.Fragment>
              ))}
            </List>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
