/**
 * Densidades customizadas do DS (@/ui) para campos de formulário.
 *
 * - `medium` (default, sem `size`): 44px — padrão dos formulários
 * - `small`: 36px — mesma altura do `Button` medium (alinhar campo ao botão)
 */
export const FORM_CONTROL_HEIGHT_MEDIUM = 44;
export const FORM_CONTROL_HEIGHT_SMALL = 36;

/** Alias de compatibilidade — altura do tamanho padrão dos campos. */
export const FORM_CONTROL_HEIGHT = FORM_CONTROL_HEIGHT_MEDIUM;

export const FORM_CONTROL_HORIZONTAL_PADDING = 14;

/** Line-height efetivo do label/valor dentro do campo (≈ 1rem). */
export const FORM_CONTROL_LINE_HEIGHT = 20;

/** Offset Y do label outlined (medium) antes de encolher. */
export const FORM_CONTROL_LABEL_OFFSET_Y =
  (FORM_CONTROL_HEIGHT_MEDIUM - FORM_CONTROL_LINE_HEIGHT) / 2;

/** Padding vertical do texto digitado (label encolhido, medium). */
export const FORM_CONTROL_INPUT_PADDING_Y = FORM_CONTROL_LABEL_OFFSET_Y;

export function getFormControlHeight(
  size: "small" | "medium" = "medium",
): number {
  return size === "small"
    ? FORM_CONTROL_HEIGHT_SMALL
    : FORM_CONTROL_HEIGHT_MEDIUM;
}

function buildFormControlOutlinedStyles(height: number) {
  const labelOffsetY = (height - FORM_CONTROL_LINE_HEIGHT) / 2;
  const inputPaddingY = labelOffsetY;

  const rootStyles = {
    minHeight: height,
    boxSizing: "border-box" as const,
    "&:not(.MuiInputBase-multiline)": {
      height,
    },
  };

  const inputStyles = {
    padding: `${inputPaddingY}px ${FORM_CONTROL_HORIZONTAL_PADDING}px`,
  };

  return {
    labelStyles: {
      "&.MuiInputLabel-outlined:not(.MuiInputLabel-sizeSmall):not(.MuiInputLabel-shrink)":
        {
          transform: `translate(${FORM_CONTROL_HORIZONTAL_PADDING}px, ${labelOffsetY}px) scale(1)`,
        },
    },
    variantStyle: () => ({
      ...rootStyles,
      "& .MuiOutlinedInput-input": inputStyles,
      "& .MuiSelect-select": {
        minHeight: height,
        height,
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
        padding: `0 ${FORM_CONTROL_HORIZONTAL_PADDING}px`,
      },
      "& .MuiSelect-icon": {
        top: "50%",
        transform: "translateY(-50%)",
      },
    }),
  };
}

const mediumFormControlStyles = buildFormControlOutlinedStyles(
  FORM_CONTROL_HEIGHT_MEDIUM,
);
const smallFormControlStyles = buildFormControlOutlinedStyles(
  FORM_CONTROL_HEIGHT_SMALL,
);

/** Variante `size="medium"` (default) para `MuiOutlinedInput` / Select. */
export function formControlMediumOutlinedVariantStyle() {
  return mediumFormControlStyles.variantStyle();
}

/** Variante `size="small"` — altura do botão (36px). */
export function formControlSmallOutlinedVariantStyle() {
  return smallFormControlStyles.variantStyle();
}

/** Label outlined + tamanho medium (default) antes de encolher. */
export const formControlMediumInputLabelStyles =
  mediumFormControlStyles.labelStyles;

/** Label outlined + `size="small"` antes de encolher. */
export const formControlSmallInputLabelStyles =
  smallFormControlStyles.labelStyles;

/**
 * `Button size="large"` — mesma altura dos campos default (44px).
 * Use para alinhar CTA ao lado de TextField/Select sem `size`.
 */
export function buttonLargeVariantStyle() {
  return {
    minHeight: FORM_CONTROL_HEIGHT_MEDIUM,
    height: FORM_CONTROL_HEIGHT_MEDIUM,
    boxSizing: "border-box" as const,
    paddingTop: 0,
    paddingBottom: 0,
  };
}

/** Line-height efetivo do MUI X Pickers (~1.4375em). */
export const PICKERS_SECTION_LINE_HEIGHT = 23;

function buildPickersOutlinedSlotStyles(height: number) {
  const sectionPaddingY = Math.max(
    (height - PICKERS_SECTION_LINE_HEIGHT - 2) / 2,
    0,
  );

  return {
    root: {
      minHeight: height,
      height,
      boxSizing: "border-box" as const,
    },
    sectionsContainer: {
      paddingTop: `${sectionPaddingY}px`,
      paddingBottom: `${sectionPaddingY}px`,
    },
  };
}

/** Overrides de slot para pickers (`MuiPickersOutlinedInput` / `MuiPickersFilledInput`). */
export function getPickersOutlinedStyleOverrides(
  inputSize: "small" | "medium" = "medium",
) {
  const height =
    inputSize === "small"
      ? FORM_CONTROL_HEIGHT_SMALL
      : FORM_CONTROL_HEIGHT_MEDIUM;
  return buildPickersOutlinedSlotStyles(height);
}

export function resolvePickersInputSize(
  ownerState: { inputSize?: "small" | "medium" } | undefined,
): "small" | "medium" {
  return ownerState?.inputSize === "small" ? "small" : "medium";
}
