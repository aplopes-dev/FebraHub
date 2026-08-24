"use client";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { UFS } from "../lib/icms-options";

export type MatrixMode = "single" | "custom";

export type MatrixState = {
  mode: MatrixMode;
  /** Valor aplicado a todas as UFs quando mode = single. */
  single: string;
  /** Valor por UF quando mode = custom. */
  byUf: Record<string, string>;
};

export function createEmptyMatrix(defaults: Record<string, number>): MatrixState {
  const byUf: Record<string, string> = {};
  for (const uf of UFS) {
    const value = defaults[uf];
    byUf[uf] = value == null ? "" : String(value);
  }
  return { mode: "single", single: "", byUf };
}

/** Resolve a alíquota efetiva de uma UF (valor único ou personalizado). */
export function matrixAliquotaFor(state: MatrixState, uf: string): string {
  return state.mode === "single" ? state.single : (state.byUf[uf] ?? "");
}

type UfRateMatrixProps = {
  title: string;
  description: string;
  state: MatrixState;
  disabled?: boolean;
  onChange: (next: MatrixState) => void;
};

/** Matriz de 27 UFs com alternância valor único / personalizado (spec erp/016). */
export function UfRateMatrix({
  title,
  description,
  state,
  disabled,
  onChange,
}: UfRateMatrixProps) {
  function setMode(mode: MatrixMode) {
    // Ao ativar "personalizados" a partir de um valor único, reflete-o nas 27 UFs
    // (spec erp/016: "valor único reflete nas 27 UFs; personalizados preserva").
    if (mode === "custom" && state.mode === "single" && state.single !== "") {
      const byUf: Record<string, string> = {};
      for (const uf of UFS) byUf[uf] = state.single;
      onChange({ ...state, mode, byUf });
      return;
    }
    // Ao voltar para "valor único", semeia o campo com o valor por UF (o comum, se
    // todos iguais; senão o primeiro) — nunca deixa vazio, que salvaria 0 em todas.
    if (mode === "single" && state.mode === "custom") {
      const values = UFS.map((uf) => state.byUf[uf] ?? "").filter(
        (value) => value !== "",
      );
      const allEqual =
        values.length > 0 && values.every((value) => value === values[0]);
      const seed = allEqual ? values[0] : (values[0] ?? state.single);
      onChange({ ...state, mode, single: seed });
      return;
    }
    onChange({ ...state, mode });
  }
  function setSingle(single: string) {
    onChange({ ...state, single });
  }
  function setUf(uf: string, value: string) {
    onChange({ ...state, byUf: { ...state.byUf, [uf]: value } });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={state.mode}
        onChange={(_event, next: MatrixMode | null) => next && setMode(next)}
        disabled={disabled}
      >
        <ToggleButton value="single">Valor único</ToggleButton>
        <ToggleButton value="custom">Valores personalizados</ToggleButton>
      </ToggleButtonGroup>

      {state.mode === "single" ? (
        <TextField
          label="Alíquota (%) para todas as UFs"
          value={state.single}
          onChange={(event) => setSingle(event.target.value)}
          disabled={disabled}
          type="text"
          slotProps={{ htmlInput: { inputMode: "decimal", pattern: "[0-9.,]*" } }}
          sx={{ maxWidth: 320 }}
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {UFS.map((uf) => (
            <TextField
              key={uf}
              label={uf}
              value={state.byUf[uf] ?? ""}
              onChange={(event) => setUf(uf, event.target.value)}
              disabled={disabled}
              size="small"
              type="text"
              slotProps={{
                htmlInput: { inputMode: "decimal", pattern: "[0-9.,]*" },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
