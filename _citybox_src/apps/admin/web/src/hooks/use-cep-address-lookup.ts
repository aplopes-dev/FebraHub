'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormClearErrors,
  type UseFormSetError,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';
import { fetchAddressByCep } from '@/lib/admin-api';
import { extractApiMessage } from '@/lib/api-error';
import { buildCepFeedbackMessage } from '@/lib/cep-feedback';

const DEFAULT_DEBOUNCE_MS = 400;

export type CepAddressFieldNames<T extends FieldValues> = {
  cep: FieldPath<T>;
  street: FieldPath<T>;
  neighborhood: FieldPath<T>;
  city: FieldPath<T>;
  state: FieldPath<T>;
};

type UseCepAddressLookupOptions<T extends FieldValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  setError: UseFormSetError<T>;
  clearErrors: UseFormClearErrors<T>;
  fieldNames?: CepAddressFieldNames<T>;
  debounceMs?: number;
  /** Quando muda (ex.: id do registro em edição), ignora o CEP pré-preenchido até o usuário editar o campo. */
  resetToken?: string | null;
};

const DEFAULT_FIELD_NAMES = {
  cep: 'cep',
  street: 'logradouro',
  neighborhood: 'bairro',
  city: 'cidade',
  state: 'estado',
} as const;

export function useCepAddressLookup<T extends FieldValues>({
  control,
  setValue,
  setError,
  clearErrors,
  fieldNames = DEFAULT_FIELD_NAMES as CepAddressFieldNames<T>,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  resetToken,
}: UseCepAddressLookupOptions<T>) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const userEditedCepRef = useRef(false);
  const lastResetTokenRef = useRef(resetToken);

  const cepValue = useWatch({ control, name: fieldNames.cep });

  useEffect(() => {
    if (resetToken !== lastResetTokenRef.current) {
      lastResetTokenRef.current = resetToken;
      userEditedCepRef.current = false;
      requestIdRef.current += 1;
      setIsLoadingCep(false);
      setCepFeedback(null);
    }
  }, [resetToken]);

  const notifyCepUserChange = useCallback(() => {
    userEditedCepRef.current = true;
  }, []);

  useEffect(() => {
    if (!userEditedCepRef.current) {
      return;
    }

    const digits = typeof cepValue === 'string' ? cepValue.replace(/\D/g, '') : '';

    if (digits.length !== 8) {
      setCepFeedback(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const requestId = ++requestIdRef.current;

      void (async () => {
        setIsLoadingCep(true);
        setCepFeedback(null);

        try {
          const result = await fetchAddressByCep(digits);

          if (requestId !== requestIdRef.current) return;

          clearErrors(fieldNames.cep);
          setCepFeedback(null);
          setValue(fieldNames.street, result.data.street as never, { shouldDirty: true });
          setValue(fieldNames.neighborhood, result.data.neighborhood as never, { shouldDirty: true });
          setValue(fieldNames.city, result.data.city as never, { shouldDirty: true });
          setValue(fieldNames.state, result.data.state as never, { shouldDirty: true });
        } catch (err) {
          if (requestId !== requestIdRef.current) return;

          const message = buildCepFeedbackMessage(extractApiMessage(err));
          setCepFeedback(message);
          setError(fieldNames.cep, { message });
          toast.warning(message);
        } finally {
          if (requestId === requestIdRef.current) {
            setIsLoadingCep(false);
          }
        }
      })();
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [
    cepValue,
    clearErrors,
    debounceMs,
    fieldNames.cep,
    fieldNames.city,
    fieldNames.neighborhood,
    fieldNames.state,
    fieldNames.street,
    setError,
    setValue,
  ]);

  return { isLoadingCep, cepFeedback, notifyCepUserChange };
}
