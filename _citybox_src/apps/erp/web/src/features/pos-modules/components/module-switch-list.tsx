"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import {
  isModuleOn,
  type PosModuleCatalogItem,
  type PosModuleStateMap,
} from "@/features/pos-modules/types/pos-module";

type ModuleSwitchListProps = {
  catalog: PosModuleCatalogItem[];
  modules: PosModuleStateMap;
  disabled?: boolean;
  onChange: (moduleId: string, on: boolean) => void;
};

/**
 * A lista de chaves, compartilhada entre o padrão da loja e o cadastro do PDV.
 *
 * Um componente só para os dois porque a pergunta é a mesma; duplicar produziria
 * duas listas que divergem no dia em que um módulo entrar no catálogo. O
 * catálogo vem da API, não de constante local — o servidor é quem sabe o que
 * pode ser desligado.
 */
export function ModuleSwitchList({
  catalog,
  modules,
  disabled = false,
  onChange,
}: ModuleSwitchListProps) {
  return (
    <Stack spacing={0}>
      {catalog.map((item) => (
        <Stack
          key={item.id}
          direction="row"
          spacing={2}
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between",
            py: 1.5,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {item.label}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {item.description}
            </Typography>
          </Box>
          <Switch
            checked={isModuleOn(modules, item.id)}
            disabled={disabled}
            onChange={(event) => onChange(item.id, event.target.checked)}
            slotProps={{ input: { "aria-label": item.label } }}
          />
        </Stack>
      ))}
    </Stack>
  );
}
