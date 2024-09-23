"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 6 * 1000,
            refetchInterval: 6 * 1000,
        },
    },
});

interface ReactQueryClientProviderProps {
    children: ReactNode;
}

export const ReactQueryClientProvider: React.FC<ReactQueryClientProviderProps> = ({ children, }: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);
