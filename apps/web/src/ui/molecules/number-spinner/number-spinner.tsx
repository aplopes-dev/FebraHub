"use client";

import * as React from "react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import AddIcon from "@mui/icons-material/Add";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import type { SxProps, Theme } from "@mui/material/styles";
import { getFormControlHeight } from "../../theme/control-sizes";

export type NumberSpinnerProps = BaseNumberField.Root.Props & {
  label?: React.ReactNode;
  size?: "small" | "medium";
  error?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * Number field estilo MUI Spinner (docs Material UI Number Field).
 * Baseado em `@base-ui/react/number-field` + OutlinedInput/Button MUI.
 *
 * @see https://mui.com/material-ui/react-number-field/#spinner-field
 */
export function NumberSpinner({
  id: idProp,
  label,
  error,
  size = "medium",
  sx,
  ...other
}: NumberSpinnerProps) {
  const generatedId = React.useId();
  const id = idProp ?? generatedId;
  const controlHeight = getFormControlHeight(size);

  return (
    <BaseNumberField.Root
      {...other}
      render={(props, state) => (
        <FormControl
          size={size}
          ref={props.ref}
          disabled={state.disabled}
          required={state.required}
          error={error}
          variant="outlined"
          sx={[
            {
              width: "100%",
              "& .MuiButton-root": {
                borderColor: "divider",
                minWidth: 0,
                minHeight: controlHeight,
                bgcolor: "action.hover",
                "&:not(.Mui-disabled)": {
                  color: "text.primary",
                },
              },
            },
            ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ]}
        >
          {props.children}
        </FormControl>
      )}
    >
      {label != null ? (
        <BaseNumberField.ScrubArea
          render={
            <Box
              component="span"
              sx={{ userSelect: "none", width: "max-content" }}
            />
          }
        >
          <FormLabel
            htmlFor={id}
            sx={{
              display: "inline-block",
              cursor: "ew-resize",
              fontSize: "0.875rem",
              color: "text.primary",
              fontWeight: 500,
              lineHeight: 1.5,
              mb: 0.5,
            }}
          >
            {label}
          </FormLabel>
          <BaseNumberField.ScrubAreaCursor>
            <OpenInFullIcon
              fontSize="small"
              sx={{ transform: "translateY(12.5%) rotate(45deg)" }}
            />
          </BaseNumberField.ScrubAreaCursor>
        </BaseNumberField.ScrubArea>
      ) : null}

      <Box sx={{ display: "flex", width: "100%" }}>
        <BaseNumberField.Decrement
          render={
            <Button
              variant="outlined"
              aria-label="Diminuir"
              size={size}
              sx={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                borderRight: 0,
                "&.Mui-disabled": {
                  borderRight: 0,
                },
              }}
            />
          }
        >
          <RemoveIcon fontSize={size} />
        </BaseNumberField.Decrement>

        <BaseNumberField.Input
          id={id}
          render={(props, state) => (
            <OutlinedInput
              inputRef={props.ref}
              value={state.inputValue}
              onBlur={props.onBlur}
              onChange={props.onChange}
              onKeyUp={props.onKeyUp}
              onKeyDown={props.onKeyDown}
              onFocus={props.onFocus}
              slotProps={{
                input: {
                  ...props,
                  // HTML `size` controla a largura intrínseca; mínimo cobre
                  // valores como "100.00" sem cortar ao lado dos botões +/-.
                  size: Math.max(
                    6,
                    Math.max(
                      (other.min?.toString() || "").length,
                      (other.max?.toString() || "").length,
                      state.inputValue.length || 1,
                    ) + 1,
                  ),
                  sx: {
                    textAlign: "center",
                  },
                },
              }}
              sx={{
                pr: 0,
                borderRadius: 0,
                flex: 1,
                minWidth: 72,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderRadius: 0,
                },
              }}
            />
          )}
        />

        <BaseNumberField.Increment
          render={
            <Button
              variant="outlined"
              aria-label="Aumentar"
              size={size}
              sx={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: 0,
                "&.Mui-disabled": {
                  borderLeft: 0,
                },
              }}
            />
          }
        >
          <AddIcon fontSize={size} />
        </BaseNumberField.Increment>
      </Box>
    </BaseNumberField.Root>
  );
}
