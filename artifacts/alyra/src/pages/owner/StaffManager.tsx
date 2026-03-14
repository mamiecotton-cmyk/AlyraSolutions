import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Plus, Search, Star, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const MOCK_STAFF = [
  { id: 1, name: "Maya Johnson", role: "Lead Technician", specialties: ["Gel-X", "Nail Art"], rating: 4.9, appointments: 248, status: "active", avatar: "MJ" },
  { id: 2, name: "Chloe Kim", role: "Technician", specialties: ["Pedicure", "Classic Manicure"], rating: 4.7, appointments: 182, status: "active", avatar: "CK" },
  { id: 3, name: "Priya Sharma", role: "Technician", specialties: ["Russian Manicure", "Nail Art"], rating: 4.8, appointments: 134, status: "on_leave", avatar: "PS" },
];

export function StaffManager() {
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState(MOCK_STAFF);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", specialties: "" });
  const { toast } = useToast();

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setStaff(prev => [...prev, {
      id: Date.now(),
      name: form.name,
      role: form.role || "Technician",
      specialties: form.specialties.split(",").map(s => s.trim()).filter(Boolean),
      rating: 5.0,
      appointments: 0,
      status: "active",
      avatar: form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    }]);
    setForm({ name: "", role: "", specialties: "" });
    setShowNew(false);
    toast({ title: "Staff member added!" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Staff</h1>
          <p className="text-muted-foreground">{staff.filter(s => s.status === "active").length} active technicians</p>
        </div>
        <Button variant="gold" className="gap-2" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search staff..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(member => (
          <Card key={member.id} className="glass-panel hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-black font-bold text-lg shrink-0">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-semibold truncate pr-2">{member.name}</h3>
                    <Badge variant={member.status === "active" ? "success" : "outline"} className="capitalize shrink-0">
                      {member.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>

              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-primary">
                  <Star className="w-4 h-4 fill-primary" />
                  <span className="font-semibold">{member.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{member.appointments} appts</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {member.specialties.map(s => (
                  <Badge key={s} variant="outline" className="text-xs border-white/10 text-white/70">{s}</Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Schedule</Button>
                <Button variant="outline" size="sm" className="flex-1">Profile</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Maya Johnson" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input placeholder="e.g. Lead Technician" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Specialties</Label>
              <Input placeholder="Gel-X, Nail Art, Pedicure" value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} />
              <p className="text-xs text-muted-foreground">Separate with commas</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="maya@salon.com" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={handleAdd}>Add Member</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
