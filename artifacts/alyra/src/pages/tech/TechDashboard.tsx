import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { formatTime } from "@/lib/utils";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { Calendar, Clock, MapPin, MessageSquare } from "lucide-react";

export function TechDashboard() {
  // Filter mock appointments to just show one tech's schedule
  const myAppointments = MOCK_APPOINTMENTS.filter(a => a.technicians.some(t => t.technicianId === 3));

  return (
    <DashboardLayout requiredRole={UserRole.technician}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">My Schedule</h1>
          <p className="text-muted-foreground">You have {myAppointments.length} appointments today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Block Time</Button>
          <Badge variant="success" className="px-4 py-2 text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Available for Walk-ins
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        {myAppointments.map((apt, index) => (
          <Card key={apt.id} className={`glass-panel overflow-hidden border-l-4 ${apt.status === 'in_progress' ? 'border-l-primary' : 'border-l-white/10'}`}>
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="p-6 md:w-48 bg-white/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5">
                <span className="text-2xl font-bold text-white mb-1">{formatTime(apt.scheduledAt)}</span>
                <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> {apt.services[0]?.duration} mins</span>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-medium text-white">{apt.clientName}</h3>
                  <Badge variant={apt.status === 'in_progress' ? 'gold' : 'outline'}>{apt.status.replace('_', ' ')}</Badge>
                </div>
                
                <p className="text-primary font-medium mb-4">{apt.services.map(s => s.name).join(', ')}</p>
                
                <div className="flex gap-4 text-sm">
                  <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-white">
                    <MessageSquare className="w-4 h-4" /> Message Client
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-white">
                    <MapPin className="w-4 h-4" /> Station 3
                  </Button>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-end bg-white/5 border-t md:border-t-0 md:border-l border-white/5">
                {apt.status === 'pending' || apt.status === 'confirmed' ? (
                  <Button variant="gold" className="w-full md:w-auto">Start Service</Button>
                ) : apt.status === 'in_progress' ? (
                  <Button variant="success" className="w-full md:w-auto bg-green-500/20 text-green-400 hover:bg-green-500/30">Complete</Button>
                ) : (
                  <Button variant="outline" disabled>Completed</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
