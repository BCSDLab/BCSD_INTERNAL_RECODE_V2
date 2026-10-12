import '@/app/providers/api-auth';
import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';

import { QueryProvider } from '@/app/providers/query-provider';
import { router } from '@/app/router/router';
import '@/app/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <RouterProvider router={router} />
  </QueryProvider>,
);
