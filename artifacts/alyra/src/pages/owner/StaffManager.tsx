import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Plus, Search, Star, Calendar, Phone, Mail, Clock, TrendingUp, Edit2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const MOCK_STAFF = [
  {
    id: 1,
    name: "Maya Johnson",
    role: "Lead Technician",
    specialties: ["Gel-X", "Nail Art"],
    rating: 4.9,
    appointments: 248,
    status: "active",
    avatar: "MJ",
    email: "maya@glamnails.com",
    phone: "(555) 201-3344",
    bio: "Maya has 7 years of experience specializing in gel extensions and intricate nail art. She's our top-rated technician and a client favorite.",
    station: "Station 1",
    commissionRate: 45,
    recentAppointments: [
      { client: "Isabella Rossi", service: "Gel-X Extensions", date: "Today 10:00 AM", amount: 125 },
      { client: "Sophia Patel", service: "Nail Art", date: "Today 2:30 PM", amount: 85 },
      { client: "Emma Thompson", service: "Russian Manicure", date: "Yesterday 11:00 AM", amount: 150 },
    ],
    schedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  {
    id: 2,
    name: "Chloe Kim",
    role: "Technician",
    specialties: ["Pedicure", "Classic Manicure"],
    rating: 4.7,
    appointments: 182,
    status: "active",
    avatar: "CK",
    email: "chloe@glamnails.com",
    phone: "(555) 408-7722",
    bio: "Chloe brings a calming touch to every pedicure and manicure session. Clients love her attention to detail and relaxing technique.",
    station: "Station 2",
    commissionRate: 40,
    recentAppointments: [
      { client: "Olivia Davis", service: "Classic Pedicure", date: "Today 1:00 PM", amount: 65 },
      { client: "Ava Wilson", service: "Classic Manicure", date: "Yesterday 3:00 PM", amount: 45 },
    ],
    schedule: ["Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  {
    id: 3,
    name: "Priya Sharma",
    role: "Technician",
    specialties: ["Russian Manicure", "Nail Art"],
    rating: 4.8,
    appointments: 134,
    status: "on_leave",
    avatar: "PS",
    email: "priya@glamnails.com",
    phone: "(555) 317-9901",
    bio: "Priya is a perfectionist with Russian manicure technique. Currently on maternity leave and returning next month.",
    station: "Station 3",
    commissionRate: 42,
    recentAppointments: [
      { client: "Mia Roberts", service: "Russian Manicure", date: "Last week Mon", amount: 150 },
    ],
    schedule: ["Mon", "Wed", "Fri"],
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function StaffManager() {
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState(MOCK_STAFF);
  const [showNew, setShowNew] = useState(false);
  const [profileMember, setProfileMember] = useState<typeof MOCK_STAFF[0] | null>(null);
  const [scheduleMember, setScheduleMember] = useState<typeof MOCK_STAFF[0] | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", phone: "", station: "", commissionRate: 0 });
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
      email: "",
      phone: "",
      bio: "",
      station: "",
      commissionRate: 40,
      recentAppointments: [],
      schedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    }]);
    setForm({ name: "", role: "", specialties: "" });
    setShowNew(false);
    toast({ title: "Staff member added!" });
  };

  const openProfile = (member: typeof MOCK_STAFF[0]) => {
    setProfileMember(member);
    setEditForm({ bio: member.bio, phone: member.phone, station: member.station, commissionRate: member.commissionRate });
    setEditingProfile(false);
  };

  const saveProfile = () => {
    if (!profileMember) return;
    setStaff(prev => prev.map(m =>
      m.id === profileMember.id
        ? { ...m, bio: editForm.bio, phone: editForm.phone, station: editForm.station, commissionRate: editForm.commissionRate }
        : m
    ));
    setProfileMember(prev => prev ? { ...prev, ...editForm } : null);
    setEditingProfile(false);
    toast({ title: "Profile updated" });
  };

  const toggleDay = (memberId: number, day: string) => {
    setStaff(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const hasDay = m.schedule.includes(day);
      return { ...m, schedule: hasDay ? m.schedule.filter(d => d !== day) : [...m.schedule, day] };
    }));
    if (scheduleMember?.id === memberId) {
      setScheduleMember(prev => {
        if (!prev) return null;
        const hasDay = prev.schedule.includes(day);
        return { ...prev, schedule: hasDay ? prev.schedule.filter(d => d !== day) : [...prev.schedule, day] };
      });
    }
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
                {member.station && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <span>{member.station}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {member.specialties.map(s => (
                  <Badge key={s} variant="outline" className="text-xs border-white/10 text-white/70">{s}</Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setScheduleMember(member); }}>
                  Schedule
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openProfile(member)}>
                  Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Dialog */}
      <Dialog open={!!profileMember} onOpenChange={(open) => { if (!open) { setProfileMember(null); setEditingProfile(false); } }}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          {profileMember && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-white font-display text-2xl">{profileMember.name}</DialogTitle>
                  {!editingProfile ? (
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => setEditingProfile(true)}>
                      <Edit2 className="w-4 h-4" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={saveProfile}><Check className="w-4 h-4 text-green-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingProfile(false)}><X className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-1">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-black font-bold text-xl shrink-0">
                    {profileMember.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium">{profileMember.role}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-primary text-sm">
                        <Star className="w-4 h-4 fill-primary" />
                        <span className="font-semibold">{profileMember.rating}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">{profileMember.appointments} total appointments</span>
                    </div>
                    <Badge variant={profileMember.status === "active" ? "success" : "outline"} className="capitalize mt-1">
                      {profileMember.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Contact & Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                    <p className="text-white truncate">{profileMember.email || "—"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                    {editingProfile
                      ? <Input className="h-7 text-sm px-2" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                      : <p className="text-white">{profileMember.phone || "—"}</p>}
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Station</p>
                    {editingProfile
                      ? <Input className="h-7 text-sm px-2" value={editForm.station} onChange={e => setEditForm({ ...editForm, station: e.target.value })} />
                      : <p className="text-white">{profileMember.station || "—"}</p>}
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Commission</p>
                    {editingProfile
                      ? <div className="flex items-center gap-1"><Input className="h-7 text-sm px-2 w-16" type="number" value={editForm.commissionRate} onChange={e => setEditForm({ ...editForm, commissionRate: Number(e.target.value) })} /><span className="text-white">%</span></div>
                      : <p className="text-white">{profileMember.commissionRate}%</p>}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  {editingProfile
                    ? <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-primary/50"
                        rows={3}
                        value={editForm.bio}
                        onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                      />
                    : <p className="text-sm text-white/80 leading-relaxed">{profileMember.bio || "No bio yet."}</p>}
                </div>

                {/* Specialties */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {profileMember.specialties.map(s => (
                      <Badge key={s} variant="outline" className="border-primary/30 text-primary">{s}</Badge>
                    ))}
                  </div>
                </div>

                {/* Recent Appointments */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Recent Appointments</p>
                  <div className="space-y-2">
                    {profileMember.recentAppointments.length === 0
                      ? <p className="text-sm text-muted-foreground">No recent appointments.</p>
                      : profileMember.recentAppointments.map((a, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2 text-sm">
                          <div>
                            <p className="text-white font-medium">{a.client}</p>
                            <p className="text-muted-foreground text-xs">{a.service} • {a.date}</p>
                          </div>
                          <span className="text-primary font-semibold">${a.amount}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setProfileMember(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={!!scheduleMember} onOpenChange={(open) => { if (!open) setScheduleMember(null); }}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          {scheduleMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white font-display text-2xl">{scheduleMember.name}'s Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-1">
                <p className="text-sm text-muted-foreground">Toggle working days. Changes take effect immediately.</p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map(day => {
                    const isOn = scheduleMember.schedule.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(scheduleMember.id, day)}
                        className={`flex flex-col items-center py-3 rounded-xl border text-xs font-semibold transition-all ${
                          isOn
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/30"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-3">Today's Appointments</p>
                  {scheduleMember.recentAppointments.filter(a => a.date.startsWith("Today")).length === 0
                    ? <p className="text-sm text-white/60">No appointments today.</p>
                    : scheduleMember.recentAppointments.filter(a => a.date.startsWith("Today")).map((a, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-white text-sm font-medium">{a.client}</p>
                          <p className="text-muted-foreground text-xs">{a.service}</p>
                        </div>
                        <span className="text-muted-foreground text-xs">{a.date.replace("Today ", "")}</span>
                      </div>
                    ))}
                </div>

                <Button variant="gold" className="w-full" onClick={() => { setScheduleMember(null); toast({ title: "Schedule saved!" }); }}>
                  Save Schedule
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
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
