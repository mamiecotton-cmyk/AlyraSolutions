import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import { Login } from "@/pages/Login";
import { PlatformDashboard } from "@/pages/admin/PlatformDashboard";
import { SalonDashboard } from "@/pages/owner/SalonDashboard";
import { WaitlistManager } from "@/pages/owner/WaitlistManager";
import { NailColors } from "@/pages/owner/NailColors";
import { TechDashboard } from "@/pages/tech/TechDashboard";
import { ClientDashboard } from "@/pages/client/ClientDashboard";
import { BookAppointment } from "@/pages/client/BookAppointment";
import { WalkIn } from "@/pages/WalkIn";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry API failures so we fallback to mock data immediately
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      
      {/* Platform Admin */}
      <Route path="/admin" component={PlatformDashboard} />
      
      {/* Salon Owner */}
      <Route path="/owner" component={SalonDashboard} />
      <Route path="/owner/waitlist" component={WaitlistManager} />
      <Route path="/owner/inventory" component={NailColors} />
      
      {/* Technician */}
      <Route path="/tech" component={TechDashboard} />
      
      {/* Client */}
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/book" component={BookAppointment} />
      
      {/* Public Walk-in */}
      <Route path="/walk-in/:salonId" component={WalkIn} />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
