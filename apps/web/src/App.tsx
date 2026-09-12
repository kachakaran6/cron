import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './components/layouts/DashboardLayout';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import CreateJobPage from './pages/CreateJobPage';
import ApiKeysPage from './pages/ApiKeysPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/jobs" replace />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="jobs" element={<JobsListPage />} />
            <Route path="jobs/new" element={<CreateJobPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
