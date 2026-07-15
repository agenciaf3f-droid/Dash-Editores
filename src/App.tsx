import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Login } from "@/components/Login";
import Index from "./pages/Index.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppGate = () => {
  const { session, loading, isRecovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Recovery flow: always reachable, and forced when in recovery. */}
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        {isRecovery ? (
          <Route path="*" element={<Navigate to="/redefinir-senha" replace />} />
        ) : !session ? (
          <Route path="*" element={<Login />} />
        ) : (
          <>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
