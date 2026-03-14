import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { Building2, Users, Calendar, TrendingUp, Plus } from "lucide-react";
import { UserRole } from "@workspace/api-client-react";

export function PlatformDashboard() {
  // Normally useGetPlatformStats()
  const stats = {
    totalSalons: 142,
    activeSalons: 138,
    totalUsers: 15420,
    totalAppointments: 89042,
    platformRevenue: 1250000,
    monthlyGrowth: 12.5
  };

  return (
    <DashboardLayout requiredRole={UserRole.platform_admin}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Platform Overview</h1>
          <p className="text-muted-foreground">Monitor global performance across all salons.</p>
        </div>
        <Button variant="gold" className="gap-2">
          <Plus className="w-4 h-4" /> New Salon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Salons" value={stats.activeSalons} icon={Building2} trend="+4 this month" />
        <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} trend="+1.2k this month" />
        <StatCard title="Appointments" value={stats.totalAppointments.toLocaleString()} icon={Calendar} trend="+15% vs last month" />
        <StatCard title="Platform Revenue" value={`$${(stats.platformRevenue / 1000).toFixed(1)}k`} icon={TrendingUp} trend="+12.5% vs last month" isGold />
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent Salons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Luxe Beauty Studio {i}</h4>
                    <p className="text-sm text-muted-foreground">luxe{i}.alyra.app</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="success">Active</Badge>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, trend, isGold }: any) {
  return (
    <Card className={isGold ? "bg-gradient-to-br from-[#D4AF37]/20 to-[#AA7C11]/10 border-[#D4AF37]/30" : "glass-panel"}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-white/5">
            <Icon className={`w-6 h-6 ${isGold ? "text-[#D4AF37]" : "text-white"}`} />
          </div>
          <Badge variant={isGold ? "gold" : "outline"} className="text-xs">{trend}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <h3 className={`text-3xl font-display font-semibold ${isGold ? "gold-gradient-text" : "text-white"}`}>{value}</h3>
      </CardContent>
    </Card>
  );
}
