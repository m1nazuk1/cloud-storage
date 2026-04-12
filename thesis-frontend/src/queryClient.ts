import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                const status = (error as {
                    response?: {
                        status?: number;
                    };
                })?.response?.status;
                if (status === 401 || status === 403 || status === 404) {
                    return false;
                }
                return failureCount < 2;
            },
            refetchOnWindowFocus: true,
            staleTime: 30 * 1000,
            gcTime: 10 * 60 * 1000,
        },
        mutations: {
            retry: 0,
        },
    },
});
