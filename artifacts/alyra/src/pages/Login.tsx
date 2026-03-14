import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button, Input, Card, Label } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const ROLE_ROUTES: Record<string, string> = {
  platform_admin: "/admin",
  salon_owner: "/owner",
  technician: "/tech",
  client: "/client",
};

export function Login() {
  const [, setLocation] = useLocation();
  const { demoLogin, login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (role: UserRole) => {
    demoLogin(role);
    setLocation(ROLE_ROUTES[role]);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please enter your email and password", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid email or password");
      }
      const { token, user } = await res.json();
      login(token, user);
      setLocation(ROLE_ROUTES[user.role] || "/client");
    } catch (err: any) {
      toast({ title: err.message || "Sign in failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-black/80 z-0" />
      <img 
        src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
        alt="Luxury Salon" 
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 z-0"
      />
      
      <div className="flex-1 flex items-center justify-center z-10 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Alyra" className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-2xl" />
            <h1 className="text-4xl font-display text-white mb-2">Alyra Solutions</h1>
            <p className="text-primary tracking-widest uppercase text-sm">PREMIUM SALON PLATFORM</p>
          </div>

          <Card className="p-8 border-white/10 glass-panel">
            <h2 className="text-2xl font-display text-white mb-6">Sign In</h2>
            
            <form onSubmit={handleSignIn} className="space-y-4 mb-8">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" variant="gold" className="w-full mt-4 h-12 text-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleDemoLogin(UserRole.platform_admin)} className="flex items-center justify-between group">
                Admin <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              <Button variant="outline" onClick={() => handleDemoLogin(UserRole.salon_owner)} className="flex items-center justify-between group border-primary/30 text-primary hover:bg-primary/10">
                Owner <Sparkles className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => handleDemoLogin(UserRole.technician)} className="flex items-center justify-between group">
                Technician <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              <Button variant="outline" onClick={() => handleDemoLogin(UserRole.client)} className="flex items-center justify-between group">
                Client <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
