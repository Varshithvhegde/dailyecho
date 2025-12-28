import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Record from "./pages/Record";
import Timeline from "./pages/Timeline";
import Insights from "./pages/Insights";
import Auth from "./pages/Auth";
import Entry from "./pages/Entry";
import NotFound from "./pages/NotFound";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";

const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedBackground />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/record" element={<Record />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/entry/:id" element={<Entry />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
