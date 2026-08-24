import { useEffect, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Padrão de data-fetching reutilizável: executa `fn` quando `deps` mudam,
 * com estados de loading/error/data e cancelamento ao desmontar.
 *
 * Substitui o trio `useState + useEffect + then/catch/finally` repetido nas
 * páginas, garantindo tratamento de erro consistente (em vez de engolir).
 */
export function useAsyncData<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
