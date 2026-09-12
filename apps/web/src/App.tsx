import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import DocsPage from './pages/DocsPage';

import OverviewPage from './features/schedules/OverviewPage';
import SchedulesListPage from './features/schedules/SchedulesListPage';
import CreateSchedulePage from './features/schedules/CreateSchedulePage';
import ScheduleDetailPage from './features/schedules/ScheduleDetailPage';
import ExecutionsListPage from './features/executions/ExecutionsListPage';
import MonitorsListPage from './features/monitors/MonitorsListPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import ApiKeysPage from './features/api-keys/ApiKeysPage';
import SettingsPage from './features/settings/SettingsPage';
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
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/docs" element={<DocsPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<AppShell />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="schedules" element={<SchedulesListPage />} />
                  <Route path="schedules/new" element={<CreateSchedulePage />} />
                  <Route path="schedules/:id" element={<ScheduleDetailPage />} />
                  <Route path="executions" element={<ExecutionsListPage />} />
                  <Route path="monitors" element={<MonitorsListPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="api-keys" element={<ApiKeysPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
