'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { buildCepFeedbackMessage } from './cep-feedback';
import {
  CepLookupError,
  fetchAddressByCep,
  type CepAddressDto,
} from './lookup-cep.service';

const DEFAULT_DEBOUNCE_MS = 400;

type UseCepAddressLookupOptions = {
  zipCode: string;
  disabled?: boolean;
  debounceMs?: number;
  onAddressFound: (address: CepAddressDto) => void;
};

export function useCepAddressLookup({
  zipCode,
  disabled = false,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onAddressFound,
}: UseCepAddressLookupOptions) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const userEditedCepRef = useRef(false);
  const onAddressFoundRef = useRef(onAddressFound);

  onAddressFoundRef.current = onAddressFound;

  const notifyCepUserChange = useCallback(() => {
    userEditedCepRef.current = true;
  }, []);

  const resetCepLookup = useCallback(() => {
    userEditedCepRef.current = false;
    requestIdRef.current += 1;
    setIsLoadingCep(false);
    setCepFeedback(null);
  }, []);

  useEffect(() => {
    if (!zipCode.trim()) {
      userEditedCepRef.current = false;
      setCepFeedback(null);
    }
  }, [zipCode]);

  useEffect(() => {
    if (disabled || !userEditedCepRef.current) {
      return;
    }

    const digits = zipCode.replace(/\D/g, '');

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

          onAddressFoundRef.current(result.data);
        } catch (error) {
          if (requestId !== requestIdRef.current) return;

          const message = buildCepFeedbackMessage(
            error instanceof CepLookupError ? error.message : 'Não foi possível consultar o CEP.',
          );
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
  }, [debounceMs, disabled, zipCode]);

  return {
    isLoadingCep,
    cepFeedback,
    notifyCepUserChange,
    resetCepLookup,
  };
}
