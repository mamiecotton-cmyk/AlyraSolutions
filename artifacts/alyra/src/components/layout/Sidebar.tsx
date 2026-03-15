import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  PaintBucket, 
  Settings, 
  Star,
  LogOut,
  Building2,
  BarChart3,
  Clock,
  UserCircle,
  Scissors,
  Wand2
} from "lucide-react";
import { UserRole } from "@workspace/api-client-react";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const getLinks = () => {
    if (!user) return [];
    
    switch (user.role) {
      case UserRole.platform_admin:
        return [
          { href: "/admin", label: "Overview", icon: LayoutDashboard },
          { href: "/admin/salons", label: "Salons", icon: Building2 },
        ];
      case UserRole.salon_owner:
        return [
          { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
          { href: "/owner/appointments", label: "Appointments", icon: CalendarDays },
          { href: "/owner/waitlist", label: "Waitlist", icon: Clock },
          { href: "/owner/staff", label: "Staff", icon: Users },
          { href: "/owner/services", label: "Services", icon: Scissors },
          { href: "/owner/inventory", label: "Nail Colors", icon: PaintBucket },
          { href: "/owner/loyalty", label: "Loyalty", icon: Star },
          { href: "/owner/settings", label: "Settings", icon: Settings },
        ];
      case UserRole.technician:
        return [
          { href: "/tech", label: "My Schedule", icon: CalendarDays },
          { href: "/tech/profile", label: "My Profile", icon: UserCircle },
        ];
      case UserRole.client:
        return [
          { href: "/client", label: "My Profile", icon: LayoutDashboard },
          { href: "/client/book", label: "Book Now", icon: CalendarDays },
          { href: "/try-on", label: "Try-On Colors", icon: Wand2 },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="flex h-screen w-64 flex-col bg-background border-r border-white/5">
      <div className="flex h-20 items-center px-6">
        <Link href={links[0]?.href || "/"} className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Alyra" className="w-8 h-8 rounded" />
          <span className="font-display text-2xl font-bold tracking-wider text-white">ALYRA</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {links.map((link) => {
          const isActive = location === link.href || (location.startsWith(link.href) && link.href !== '/admin' && link.href !== '/owner' && link.href !== '/client');
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-black font-bold">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button 
          onClick={() => { logout(); setLocation("/login"); toast({ title: "Signed out" }); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
