import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/hooks/useI18n";

const Index = lazy(() => import("./pages/Index"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const QuantumPrediction = lazy(() => import("./pages/QuantumPrediction"));
const PredictionHistory = lazy(() => import("./pages/PredictionHistory"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AccountDeletion = lazy(() => import("./pages/AccountDeletion"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();
const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Suspense fallback={<div className="min-h-screen bg-background" aria-label="正在加载" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin-users" element={<AdminUsers />} />
                <Route path="/quantum-prediction" element={<QuantumPrediction />} />
                <Route path="/prediction-history" element={<PredictionHistory />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/account-deletion" element={<AccountDeletion />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </TooltipProvider>
      </I18nProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
