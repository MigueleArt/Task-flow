import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import LoginPage from './pages/LoginPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import NewTicketPage from './pages/NewTicketPage.tsx';
import UsersPage from './pages/UsersPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* LOGIN ROUTE */}
          <Route path="/login" element={<LoginPage />} />

          {/* SECURE DASHBOARD ROUTE */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* SECURE NEW TICKET ROUTE */}
          <Route
            path="/tickets/nuevo"
            element={
              <ProtectedRoute>
                <NewTicketPage />
              </ProtectedRoute>
            }
          />

          {/* SECURE ADMIN USERS ROUTE */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute adminOnly>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* FALLBACK REDIRECT */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
