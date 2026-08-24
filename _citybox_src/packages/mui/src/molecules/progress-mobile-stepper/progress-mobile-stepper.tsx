'use client';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import MobileStepper from '@mui/material/MobileStepper';
import type { SxProps, Theme } from '@mui/material/styles';
import MuiButton from '@mui/material/Button';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

export type ProgressMobileStepperProps = {
  /** Total de passos (mín. 1). */
  steps: number;
  /** Passo ativo (0-based). */
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  /** Aria-label do progresso linear. */
  progressAriaLabel?: string;
  sx?: SxProps<Theme>;
};

/**
 * Stepper linear (progress) com botões Voltar/Próximo.
 * Controlado pelo pai — estado e validação ficam fora do componente.
 */
export function ProgressMobileStepper({
  steps,
  activeStep,
  onNext,
  onBack,
  nextLabel = 'Próximo',
  backLabel = 'Voltar',
  nextDisabled = false,
  backDisabled = false,
  progressAriaLabel = 'Progresso dos passos',
  sx,
}: ProgressMobileStepperProps) {
  const theme = useTheme();
  const nextButtonRef = React.useRef<HTMLButtonElement>(null);
  const backButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousActiveStepRef = React.useRef(activeStep);
  const lastIndex = Math.max(0, steps - 1);

  React.useEffect(() => {
    const previousActiveStep = previousActiveStepRef.current;

    if (activeStep === 0 && previousActiveStep > 0) {
      nextButtonRef.current?.focus();
    } else if (
      activeStep === lastIndex &&
      previousActiveStep === lastIndex - 1 &&
      lastIndex > 0
    ) {
      backButtonRef.current?.focus();
    }

    previousActiveStepRef.current = activeStep;
  }, [activeStep, lastIndex]);

  return (
    <MobileStepper
      variant="progress"
      steps={steps}
      position="static"
      activeStep={activeStep}
      sx={{ flexGrow: 1, bgcolor: 'transparent', ...sx }}
      slotProps={{
        progress: {
          'aria-label': progressAriaLabel,
        },
      }}
      nextButton={
        <MuiButton
          size="small"
          onClick={onNext}
          disabled={nextDisabled}
          ref={nextButtonRef}
        >
          {nextLabel}
          {theme.direction === 'rtl' ? (
            <KeyboardArrowLeft />
          ) : (
            <KeyboardArrowRight />
          )}
        </MuiButton>
      }
      backButton={
        <MuiButton
          size="small"
          onClick={onBack}
          disabled={backDisabled || activeStep === 0}
          ref={backButtonRef}
        >
          {theme.direction === 'rtl' ? (
            <KeyboardArrowRight />
          ) : (
            <KeyboardArrowLeft />
          )}
          {backLabel}
        </MuiButton>
      }
    />
  );
}
