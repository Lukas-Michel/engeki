import { useEffect, useState } from 'react';

type AsyncState<T> = {
  data: T;
  error?: string;
  loading: boolean;
};

type AsyncStateWithFactory<T> = AsyncState<T> & {
  factory: () => Promise<T>;
};

export function useAsync<T>(factory: () => Promise<T>, initialData: T): AsyncState<T> {
  const [state, setState] = useState<AsyncStateWithFactory<T>>({
    data: initialData,
    factory,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    factory()
      .then((data) => {
        if (mounted) {
          setState({ data, factory, loading: false });
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : 'Something went wrong.',
            factory,
            loading: false,
          }));
        }
      });

    return () => {
      mounted = false;
    };
  }, [factory]);

  if (state.factory !== factory) {
    return {
      data: state.data,
      error: undefined,
      loading: true,
    };
  }

  return state;
}
