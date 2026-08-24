"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { Checkbox, Typography } from "@citybox/mui";
import { groupSelectionState } from "@/features/users-permissions/lib/permission-tree";
import type { PermissionGroup } from "@/features/users-permissions/types/permission-profile";

type PermissionGroupRowProps = {
  group: PermissionGroup;
  selected: ReadonlySet<string>;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleGroup: () => void;
  onToggleItem: (id: string) => void;
};

/**
 * Linha de um grupo (módulo) na árvore de permissões — checkbox de grupo +
 * contador "x/y" + chevron; expandido mostra os subgrupos (entidades) com
 * as ações granulares. Molde do "Perfis de Acesso" da referência ConnectPlug.
 */
export function PermissionGroupRow({
  group,
  selected,
  expanded,
  onToggleExpand,
  onToggleGroup,
  onToggleItem,
}: PermissionGroupRowProps) {
  const { selectedCount, total, checked, indeterminate } = groupSelectionState(
    group,
    selected,
  );

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", py: 0.5, pr: 2, cursor: "pointer" }}
        onClick={onToggleExpand}
      >
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          onClick={(event) => event.stopPropagation()}
          onChange={onToggleGroup}
          slotProps={{ input: { "aria-label": `Selecionar todos os acessos de ${group.label}` } }}
        />
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          {group.label}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {selectedCount}/{total}
        </Typography>
        <IconButton
          size="small"
          aria-hidden
          tabIndex={-1}
          sx={{
            pointerEvents: "none",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "text.secondary",
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      <Collapse in={expanded}>
        <Box sx={{ pl: 5, pb: 1.5 }}>
          {group.subgroups.map((subgroup) => (
            <Box key={subgroup.id} sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  mb: 0.5,
                }}
              >
                {subgroup.label} ({subgroup.items.filter((item) => selected.has(item.id)).length}/
                {subgroup.items.length})
              </Typography>
              <Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                {subgroup.items.map((item) => (
                  <Stack
                    key={item.id}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Checkbox
                      checked={selected.has(item.id)}
                      onChange={() => onToggleItem(item.id)}
                      slotProps={{ input: { "aria-label": item.label } }}
                    />
                    <Typography variant="body2">{item.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
