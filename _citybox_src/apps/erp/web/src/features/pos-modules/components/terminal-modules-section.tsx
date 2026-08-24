"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { ModuleSwitchList } from "@/features/pos-modules/components/module-switch-list";
import { usePosModuleDefaultsQuery } from "@/features/pos-modules/hooks/use-pos-modules";
import {
  withModule,
  type PosModuleStateMap,
} from "@/features/pos-modules/types/pos-module";

type TerminalModulesSectionProps = {
  /**
   * `null` = seguir o padrão da loja.
   *
   * Tipo frouxo (`Record<string, string>`) porque vem do formulário do
   * terminal, que não conhece o enum. `sanitizeModuleStates` no servidor é
   * quem garante o conjunto válido — repetir a garantia aqui só moveria o
   * problema.
   */
  overrides: Record<string, string> | null;
  onChange: (overrides: Record<string, string> | null) => void;
};

/**
 * Seção de módulos dentro do cadastro de um PDV.
 *
 * ⚠️ **O estado "herdando" tem que ser visível.** Um formulário que mostra seis
 * chaves sem dizer de onde vieram faz o gerente acreditar que já sobrescreveu —
 * e depois estranhar que mudar o padrão da loja mexeu naquele caixa. Daí a
 * chave "Usar o padrão da loja" no topo, e as demais desabilitadas enquanto ela
 * está ligada.
 */
export function TerminalModulesSection({
  overrides,
  onChange,
}: TerminalModulesSectionProps) {
  const defaultsQuery = usePosModuleDefaultsQuery();
  const inherits = overrides === null;

  if (!defaultsQuery.data) {
    return <Skeleton variant="rounded" height={200} />;
  }

  const defaults = defaultsQuery.data;
  // Enquanto herda, mostra o conjunto da loja — desabilitado. Mostrar tudo
  // ligado seria mentira; mostrar vazio esconderia o que o caixa vai fazer.
  const shown: PosModuleStateMap = (inherits
    ? defaults.modules
    : overrides) as PosModuleStateMap;

  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Usar o padrão da loja
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {inherits
              ? `Este PDV segue o padrão${defaults.profileName ? ` (${defaults.profileName})` : ""} e acompanha as mudanças dele.`
              : "Este PDV tem a própria configuração e não muda junto com a loja."}
          </Typography>
        </Box>
        <Switch
          checked={inherits}
          onChange={(event) =>
            // Desligar copia o padrão como ponto de partida — recomeçar do zero
            // faria o gerente reconfigurar seis chaves para mudar uma.
            onChange(event.target.checked ? null : { ...defaults.modules })
          }
          slotProps={{ input: { "aria-label": "Usar o padrão da loja" } }}
        />
      </Stack>

      <ModuleSwitchList
        catalog={defaults.catalog.optional}
        modules={shown}
        disabled={inherits}
        onChange={(moduleId, on) =>
          onChange(withModule(shown, moduleId, on))
        }
      />
    </Stack>
  );
}
