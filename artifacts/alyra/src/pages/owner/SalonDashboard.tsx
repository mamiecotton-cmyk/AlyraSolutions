import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { formatTime, formatCurrency } from "@/lib/utils";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { ArrowUpRight, DollarSign, Users, Clock, CalendarCheck } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 6890 },
  { name: 'Sat', revenue: 8390 },
  { name: 'Sun', revenue: 7490 },
];

export function SalonDashboard() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Good morning, Elena</h1>
          <p className="text-muted-foreground">Here's what's happening at Glam Nails Studio today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setLocation("/owner/appointments")}>View Appointments</Button>
          <Button variant="gold" onClick={() => setLocation("/owner/appointments")}>New Booking</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-panel cursor-pointer hover:border-primary/30 transition-all" onClick={() => setLocation("/owner/appointments")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20 text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <h3 className="text-2xl font-bold text-white">$1,450</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel cursor-pointer hover:border-blue-400/30 transition-all" onClick={() => setLocation("/owner/appointments")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <h3 className="text-2xl font-bold text-white">24</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel cursor-pointer hover:border-purple-400/30 transition-all" onClick={() => setLocation("/owner/waitlist")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Walk-ins</p>
                <h3 className="text-2xl font-bold text-white">8</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel cursor-pointer hover:border-orange-400/30 transition-all" onClick={() => setLocation("/owner/waitlist")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20 text-orange-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait</p>
                <h3 className="text-2xl font-bold text-white">15m</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-panel p-6">
            <h3 className="text-xl font-display font-semibold mb-6">Revenue This Week</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f0f11', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#D4AF37' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div>
          <Card className="glass-panel h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Today's Schedule</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setLocation("/owner/appointments")}>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                {MOCK_APPOINTMENTS.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
                    onClick={() => setLocation("/owner/appointments")}
                  >
                    <div className="w-16 flex flex-col items-center justify-center border-r border-white/10 pr-4">
                      <span className="text-sm font-semibold text-white">{formatTime(apt.scheduledAt)}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{apt.clientName}</h4>
                      <p className="text-sm text-primary mb-2">{apt.services[0]?.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white">
                            {apt.technicians[0]?.firstName.charAt(0)}
                          </div>
                          {apt.technicians[0]?.firstName}
                        </span>
                        <Badge variant={apt.status === 'in_progress' ? 'gold' : 'outline'} className="text-[10px]">
                          {apt.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
