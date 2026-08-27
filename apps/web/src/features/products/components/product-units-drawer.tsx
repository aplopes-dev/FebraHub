"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Checkbox,
  Drawer,
  FormField,
  MenuItem,
  Select,
} from "@/ui";
import {
  MOCK_PRODUCT_UNITS,
  PRODUCT_UNIT_UF_OPTIONS,
  type ProductUnit,
} from "@/features/products/data/mock-units";

type ProductUnitsDrawerProps = {
  units?: ProductUnit[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUnitIds: string[];
  onSave: (unitIds: string[]) => void;
};

function filterUnits(
  units: ProductUnit[],
  search: string,
  uf: string,
): ProductUnit[] {
  const normalizedSearch = search.trim().toLowerCase();
  return units.filter((unit) => {
    if (uf !== "all" && unit.uf !== uf) return false;
    if (!normalizedSearch) return true;
    const haystack = `${unit.name} ${unit.city} ${unit.uf}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });
}

function ProductUnitsDrawerBody({
  draftIds,
  setDraftIds,
  units,
}: {
  draftIds: string[];
  setDraftIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  units: ProductUnit[];
}) {
  const [search, setSearch] = useState("");
  const [uf, setUf] = useState("all");

  const filteredUnits = useMemo(
    () => filterUnits(units, search, uf),
    [search, uf, units],
  );

  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    return filteredUnits.slice(0, 5);
  }, [filteredUnits, search]);

  function toggleUnit(unitId: string) {
    setDraftIds((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Selecione as lojas onde o produto estará disponível.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { sm: "minmax(0, 1fr) 8rem" },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <FormField
            id="unit-search"
            label="Buscar"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={searchSuggestions.length > 0}
            autoComplete="off"
            placeholder="Buscar unidade, cidade…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {searchSuggestions.length > 0 ? (
            <List
              role="listbox"
              sx={{
                position: "absolute",
                zIndex: 20,
                mt: 0.5,
                maxHeight: 192,
                width: "100%",
                overflow: "auto",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                boxShadow: 2,
                py: 0.5,
              }}
            >
              {searchSuggestions.map((unit) => (
                <ListItemButton
                  key={unit.id}
                  role="option"
                  onClick={() => {
                    setSearch(unit.name);
                    if (!draftIds.includes(unit.id)) {
                      setDraftIds((prev) => [...prev, unit.id]);
                    }
                  }}
                >
                  <ListItemText
                    primary={unit.name}
                    secondary={`${unit.city}/${unit.uf}`}
                    slotProps={{
                      secondary: { variant: "caption" },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : null}
        </Box>

        <FormControl fullWidth>
          <InputLabel id="unit-uf-label">UF</InputLabel>
          <Select
            labelId="unit-uf-label"
            id="unit-uf"
            label="UF"
            value={uf}
            onChange={(event) => setUf(event.target.value as string)}
          >
            {PRODUCT_UNIT_UF_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Stack spacing={1}>
        {filteredUnits.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              py: 4,
              textAlign: "center",
            }}
          >
            Nenhuma unidade encontrada.
          </Typography>
        ) : (
          filteredUnits.map((unit) => {
            const checked = draftIds.includes(unit.id);
            return (
              <Box
                key={unit.id}
                component="label"
                sx={{
                  display: "flex",
                  cursor: "pointer",
                  alignItems: "flex-start",
                  gap: 1.5,
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  px: 1.5,
                  py: 1.5,
                  transition: "background-color 0.2s",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Checkbox
                  checked={checked}
                  onChange={() => toggleUnit(unit.id)}
                  sx={{ mt: -0.25, p: 0.5 }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {unit.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {unit.city} — {unit.uf}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Stack>
    </Stack>
  );
}

export function ProductUnitsDrawer({
  open,
  onOpenChange,
  selectedUnitIds,
  onSave,
  units = MOCK_PRODUCT_UNITS,
}: ProductUnitsDrawerProps) {
  if (!open) return null;

  return (
    <ProductUnitsDrawerSession
      selectedUnitIds={selectedUnitIds}
      onSave={onSave}
      onOpenChange={onOpenChange}
      units={units}
    />
  );
}

function ProductUnitsDrawerSession({
  selectedUnitIds,
  onSave,
  onOpenChange,
  units,
}: {
  selectedUnitIds: string[];
  onSave: (unitIds: string[]) => void;
  onOpenChange: (open: boolean) => void;
  units: ProductUnit[];
}) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedUnitIds);

  function handleSave() {
    onSave(draftIds);
    onOpenChange(false);
  }

  return (
    <Drawer
      open
      onClose={() => onOpenChange(false)}
      title="Unidades"
      width={480}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="text" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="contained" onClick={handleSave}>
            Salvar
          </Button>
        </Stack>
      }
    >
      <ProductUnitsDrawerBody
        draftIds={draftIds}
        setDraftIds={setDraftIds}
        units={units}
      />
    </Drawer>
  );
}
