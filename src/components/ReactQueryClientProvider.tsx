'use client'

import { QueryClient, QueryClientProvider } from 'react-query'
import { useState } from 'react'

export const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // With SSR, we usually want to set some default staleTime
      // above 0 to avoid refetching immediately on the client
      staleTime: 30 * 1000,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
    },
  },
})

export const ReactQueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return <QueryClientProvider client={defaultQueryClient}>{children}</QueryClientProvider>
}