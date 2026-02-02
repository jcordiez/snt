'use client';

import { QueryClientProvider } from '@tanstack/react-query';
//import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { ComparisonSidebarProvider } from '@/components/comparison-sidebar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonSidebarProvider>
        {children}
      </ComparisonSidebarProvider>
      {/*process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}*/}
    </QueryClientProvider>
  );
}
