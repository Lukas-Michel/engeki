import { useEffect, useState } from 'react';

type AsyncState<T> = {
  data: T;
  error?: string;
  loading: boolean;
};

export function useAsync<T>(factory: () => Promise<T>, initialData: T) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    factory()
      .then((data) => {
        if (mounted) {
          setState({ data, loading: false });
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : 'Something went wrong.',
            loading: false,
          }));
        }
      });

    return () => {
      mounted = false;
    };
  }, [factory]);

  return state;
}
