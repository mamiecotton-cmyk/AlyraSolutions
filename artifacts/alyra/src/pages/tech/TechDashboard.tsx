import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { UserRole, AppointmentStatus } from "@workspace/api-client-react";
import { formatTime } from "@/lib/utils";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { Calendar, Clock, MapPin, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function TechDashboard() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState(
    MOCK_APPOINTMENTS.filter(a => a.technicians.some(t => t.technicianId === 3))
  );
  const [showBlockTime, setShowBlockTime] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: "", startTime: "", endTime: "", reason: "" });

  const handleStartService = (id: number) => {
    const now = new Date();
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: AppointmentStatus.in_progress, startedAt: now } : a
    ));
    toast({ title: `Service started at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` });
  };

  const handleComplete = (id: number) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: AppointmentStatus.completed } : a));
    toast({ title: "Service completed! Great work." });
  };

  const handleMessage = (apt: any) => {
    toast({ title: `Opening message to ${apt.clientName}...` });
  };

  const handleBlockTime = () => {
    setShowBlockTime(false);
    toast({ title: "Time blocked successfully" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.technician}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">My Schedule</h1>
          <p className="text-muted-foreground">You have {appointments.length} appointments today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowBlockTime(true)}>Block Time</Button>
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
        {appointments.map((apt) => (
          <Card key={apt.id} className={`glass-panel overflow-hidden border-l-4 ${apt.status === 'in_progress' ? 'border-l-primary' : apt.status === 'completed' ? 'border-l-green-500' : 'border-l-white/10'}`}>
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="p-6 md:w-48 bg-white/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5">
                <span className="text-2xl font-bold text-white mb-1">
                  {(apt as any).startedAt
                    ? (apt as any).startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : formatTime(apt.scheduledAt)}
                </span>
                {(apt as any).startedAt
                  ? <span className="text-xs text-primary flex items-center gap-1"><Clock className="w-3 h-3"/> Started now</span>
                  : <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> {apt.services[0]?.duration} mins</span>}
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-medium text-white">{apt.clientName}</h3>
                  <Badge variant={apt.status === 'in_progress' ? 'gold' : apt.status === 'completed' ? 'success' : 'outline'}>
                    {apt.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <p className="text-primary font-medium mb-4">{apt.services.map(s => s.name).join(', ')}</p>
                
                <div className="flex gap-4 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 px-0 text-muted-foreground hover:text-white"
                    onClick={() => handleMessage(apt)}
                  >
                    <MessageSquare className="w-4 h-4" /> Message Client
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:text-white">
                    <MapPin className="w-4 h-4" /> Station 3
                  </Button>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-end bg-white/5 border-t md:border-t-0 md:border-l border-white/5">
                {(apt.status === 'pending' || apt.status === 'confirmed') ? (
                  <Button variant="gold" className="w-full md:w-auto" onClick={() => handleStartService(apt.id)}>
                    Start Service
                  </Button>
                ) : apt.status === 'in_progress' ? (
                  <Button
                    className="w-full md:w-auto bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                    onClick={() => handleComplete(apt.id)}
                  >
                    Complete
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full md:w-auto">Completed</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {appointments.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No appointments for today. Enjoy your day!</p>
          </div>
        )}
      </div>

      <Dialog open={showBlockTime} onOpenChange={setShowBlockTime}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Block Time Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={blockForm.date} onChange={e => setBlockForm({ ...blockForm, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={blockForm.startTime} onChange={e => setBlockForm({ ...blockForm, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={blockForm.endTime} onChange={e => setBlockForm({ ...blockForm, endTime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input placeholder="e.g. Lunch break, Training" value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowBlockTime(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={handleBlockTime}>Block It</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
