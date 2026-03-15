import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import { Login } from "@/pages/Login";
import { PlatformDashboard } from "@/pages/admin/PlatformDashboard";
import { SalonsList } from "@/pages/admin/SalonsList";
import { SalonDashboard } from "@/pages/owner/SalonDashboard";
import { AppointmentsList } from "@/pages/owner/AppointmentsList";
import { WaitlistManager } from "@/pages/owner/WaitlistManager";
import { StaffManager } from "@/pages/owner/StaffManager";
import { NailColors } from "@/pages/owner/NailColors";
import { LoyaltyConfig } from "@/pages/owner/LoyaltyConfig";
import { SalonSettings } from "@/pages/owner/SalonSettings";
import { ServicesManager } from "@/pages/owner/ServicesManager";
import { SalonLanding } from "@/pages/SalonLanding";
import { VirtualTryOn } from "@/pages/VirtualTryOn";
import { TechDashboard } from "@/pages/tech/TechDashboard";
import { TechProfile } from "@/pages/tech/TechProfile";
import { ClientDashboard } from "@/pages/client/ClientDashboard";
import { BookAppointment } from "@/pages/client/BookAppointment";
import { WalkIn } from "@/pages/WalkIn";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
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
      <Route path="/admin/salons" component={SalonsList} />
      
      {/* Salon Owner */}
      <Route path="/owner" component={SalonDashboard} />
      <Route path="/owner/appointments" component={AppointmentsList} />
      <Route path="/owner/waitlist" component={WaitlistManager} />
      <Route path="/owner/staff" component={StaffManager} />
      <Route path="/owner/inventory" component={NailColors} />
      <Route path="/owner/loyalty" component={LoyaltyConfig} />
      <Route path="/owner/services" component={ServicesManager} />
      <Route path="/owner/settings" component={SalonSettings} />
      <Route path="/salon" component={SalonLanding} />
      <Route path="/try-on" component={VirtualTryOn} />
      
      {/* Technician */}
      <Route path="/tech" component={TechDashboard} />
      <Route path="/tech/profile" component={TechProfile} />
      
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
