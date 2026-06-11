import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import SkeletonPage from "./components/SkeletonPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const ToolCategory = lazy(() => import("./pages/ToolCategory.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AccountPage = lazy(() => import("./pages/AccountPage.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const ConviTransfer = lazy(() => import("./pages/ConviTransfer.jsx"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
          <Routes>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<SkeletonPage />}>
                    <Home />
                  </Suspense>
                }
              />
              <Route
                path="/transfer"
                element={
                  <Suspense fallback={<SkeletonPage />}>
                    <ConviTransfer />
                  </Suspense>
                }
              />
              <Route
                path="/transfer/:transferId"
                element={
                  <Suspense fallback={<SkeletonPage />}>
                    <ConviTransfer />
                  </Suspense>
                }
              />
              <Route
                path="/:category"
                element={
                  <Suspense fallback={<SkeletonPage />}>
                    <ToolCategory />
                  </Suspense>
                }
              />
              <Route
                path="/:category/:toolSlug"
                element={
                  <Suspense fallback={<SkeletonPage />}>
                    <ToolCategory />
                  </Suspense>
                }
              />
              <Route
                path="/auth"
                element={
                  <Suspense fallback={<SkeletonPage />}>
                    <AuthPage />
                  </Suspense>
                }
              />
              <Route
                path="/auth/callback"
                element={
                  <Suspense fallback={<SkeletonPage />}>
                    <OAuthCallbackPage />
                  </Suspense>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Suspense fallback={<SkeletonPage />}>
                      <Admin />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<SkeletonPage />}>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<SkeletonPage />}>
                      <AccountPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
