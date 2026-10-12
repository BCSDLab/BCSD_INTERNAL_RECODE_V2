import '@/app/providers/api-auth';
import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';

import { createQueryClient, QueryProvider } from '@/app/providers/query-provider';
import { createAppRouter } from '@/app/router/router';
import '@/app/styles/globals.css';

const queryClient = createQueryClient();
const router = createAppRouter(queryClient);

createRoot(document.getElementById('root')!).render(
  <QueryProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryProvider>,
);
