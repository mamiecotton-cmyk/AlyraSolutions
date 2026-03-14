import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { formatTime } from "@/lib/utils";
import { Search, Plus, Filter, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "outline",
  confirmed: "success",
  in_progress: "gold",
  completed: "secondary",
  cancelled: "destructive",
};

export function AppointmentsList() {
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [selected, setSelected] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const { toast } = useToast();

  const filtered = appointments.filter(a =>
    a.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    a.services.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStatusChange = (id: number, newStatus: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    setSelected(null);
    toast({ title: `Appointment marked as ${newStatus.replace("_", " ")}` });
  };

  const handleCancel = (id: number) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" as any } : a));
    setSelected(null);
    toast({ title: "Appointment cancelled" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Appointments</h1>
          <p className="text-muted-foreground">{filtered.length} appointments today</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Filter</Button>
          <Button variant="gold" className="gap-2" onClick={() => setShowNew(true)}><Plus className="w-4 h-4" /> New Appointment</Button>
        </div>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by client or service..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filtered.map(apt => (
          <Card
            key={apt.id}
            className={`glass-panel border-l-4 cursor-pointer hover:bg-white/5 transition-all ${apt.status === "in_progress" ? "border-l-primary" : apt.status === "completed" ? "border-l-green-500" : apt.status === "cancelled" ? "border-l-red-500" : "border-l-white/10"}`}
            onClick={() => setSelected(apt)}
          >
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="p-5 md:w-40 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex items-center gap-1 text-white font-semibold text-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formatTime(apt.scheduledAt)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Clock className="w-3 h-3" />
                  {apt.services[0]?.duration} mins
                </div>
              </div>
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white font-medium text-lg">{apt.clientName}</h3>
                  <Badge variant={STATUS_COLORS[apt.status] as any} className="capitalize">
                    {apt.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-primary text-sm mb-2">{apt.services.map(s => s.name).join(", ")}</p>
                <p className="text-muted-foreground text-sm">
                  with {apt.technicians.map(t => t.firstName).join(", ")} •
                  <span className="text-white ml-1">${apt.totalAmount}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No appointments found</p>
          </div>
        )}
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="bg-card border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white font-display text-2xl">{selected.clientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="text-white">{selected.services.map((s: any) => s.name).join(", ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-white">{formatTime(selected.scheduledAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Technician</span>
                  <span className="text-white">{selected.technicians.map((t: any) => t.firstName).join(", ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-primary font-bold">${selected.totalAmount}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selected.status === "confirmed" && (
                  <Button variant="gold" className="col-span-2" onClick={() => handleStatusChange(selected.id, "in_progress")}>
                    Start Service
                  </Button>
                )}
                {selected.status === "in_progress" && (
                  <Button variant="success" className="col-span-2 bg-green-500/20 text-green-400 hover:bg-green-500/30" onClick={() => handleStatusChange(selected.id, "completed")}>
                    Mark Complete
                  </Button>
                )}
                {selected.status !== "cancelled" && selected.status !== "completed" && (
                  <Button variant="outline" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 border-white/5" onClick={() => handleCancel(selected.id)}>
                    Cancel
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">New Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input placeholder="e.g. Isabella Rossi" />
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Input placeholder="e.g. Gel-X Extensions" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Technician</Label>
              <Input placeholder="e.g. Mia Chen" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={() => { setShowNew(false); toast({ title: "Appointment created!" }); }}>Book It</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
