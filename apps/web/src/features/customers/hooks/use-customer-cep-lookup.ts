"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/ui";
import { ApiError } from "@/lib/api/client";
import { fetchAddressByCep } from "@/features/customers/api/cep.service";
import { buildCepFeedbackMessage } from "@/features/customers/lib/cep-feedback";

const DEFAULT_DEBOUNCE_MS = 400;

export type CepFillFields = {
  street: string;
  district: string;
  city: string;
  state: string;
};

type UseCustomerCepLookupOptions = {
  zipCode: string;
  onFill: (fields: CepFillFields) => void;
  debounceMs?: number;
  /** Quando muda (ex.: id do endereço / cliente), ignora CEP pré-preenchido. */
  resetToken?: string | null;
};

/**
 * Lookup de CEP para forms controlados (sem react-hook-form).
 * Só busca depois de `notifyCepUserChange` — evita overwrite em edição.
 */
export function useCustomerCepLookup({
  zipCode,
  onFill,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  resetToken,
}: UseCustomerCepLookupOptions) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const userEditedCepRef = useRef(false);
  const lastResetTokenRef = useRef(resetToken);
  const onFillRef = useRef(onFill);
  onFillRef.current = onFill;

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

    const digits = zipCode.replace(/\D/g, "");

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

          setCepFeedback(null);
          onFillRef.current({
            street: result.data.street,
            district: result.data.neighborhood,
            city: result.data.city,
            state: result.data.state,
          });
        } catch (err) {
          if (requestId !== requestIdRef.current) return;

          const apiMessage =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "";
          const message = buildCepFeedbackMessage(apiMessage);
          setCepFeedback(message);
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
  }, [zipCode, debounceMs]);

  return { isLoadingCep, cepFeedback, notifyCepUserChange };
}
