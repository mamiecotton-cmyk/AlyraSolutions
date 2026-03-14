import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Plus, Search, Star, Calendar, Phone, Mail, Clock, TrendingUp, Edit2, X, UserX, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUSES = [
  { value: "active", label: "Active", color: "success" as const },
  { value: "on_leave", label: "On Leave", color: "outline" as const },
  { value: "terminated", label: "Terminated", color: "destructive" as const },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type StaffMember = {
  id: number;
  name: string;
  role: string;
  specialties: string[];
  rating: number;
  appointments: number;
  status: string;
  avatar: string;
  email: string;
  phone: string;
  bio: string;
  station: string;
  commissionRate: number;
  schedule: string[];
  recentAppointments: { client: string; service: string; date: string; amount: number }[];
};

const MOCK_STAFF: StaffMember[] = [
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
    schedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    recentAppointments: [
      { client: "Isabella Rossi", service: "Gel-X Extensions", date: "Today 10:00 AM", amount: 125 },
      { client: "Sophia Patel", service: "Nail Art", date: "Today 2:30 PM", amount: 85 },
      { client: "Emma Thompson", service: "Russian Manicure", date: "Yesterday 11:00 AM", amount: 150 },
    ],
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
    schedule: ["Tue", "Wed", "Thu", "Fri", "Sat"],
    recentAppointments: [
      { client: "Olivia Davis", service: "Classic Pedicure", date: "Today 1:00 PM", amount: 65 },
      { client: "Ava Wilson", service: "Classic Manicure", date: "Yesterday 3:00 PM", amount: 45 },
    ],
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
    schedule: ["Mon", "Wed", "Fri"],
    recentAppointments: [
      { client: "Mia Roberts", service: "Russian Manicure", date: "Last week Mon", amount: 150 },
    ],
  },
];

function makeAvatar(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export function StaffManager() {
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [showNew, setShowNew] = useState(false);
  const [viewMember, setViewMember] = useState<StaffMember | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StaffMember>>({});
  const [newSpecialty, setNewSpecialty] = useState("");
  const [scheduleMember, setScheduleMember] = useState<StaffMember | null>(null);
  const [addForm, setAddForm] = useState({ name: "", role: "", email: "", phone: "", specialties: "", station: "", commissionRate: "40" });
  const { toast } = useToast();

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const openProfile = (member: StaffMember) => {
    setViewMember(member);
    setEditForm({ ...member });
    setEditMode(false);
    setNewSpecialty("");
  };

  const startEdit = () => setEditMode(true);

  const cancelEdit = () => {
    setEditForm({ ...viewMember! });
    setEditMode(false);
    setNewSpecialty("");
  };

  const saveEdit = () => {
    if (!viewMember || !editForm.name?.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }
    const updated: StaffMember = {
      ...viewMember,
      ...editForm,
      name: editForm.name!.trim(),
      avatar: makeAvatar(editForm.name!.trim()),
    } as StaffMember;
    setStaff(prev => prev.map(m => m.id === updated.id ? updated : m));
    setViewMember(updated);
    setEditMode(false);
    toast({ title: "Profile saved" });
  };

  const addSpecialty = () => {
    const s = newSpecialty.trim();
    if (!s) return;
    setEditForm(prev => ({ ...prev, specialties: [...(prev.specialties || []), s] }));
    setNewSpecialty("");
  };

  const removeSpecialty = (idx: number) => {
    setEditForm(prev => ({ ...prev, specialties: (prev.specialties || []).filter((_, i) => i !== idx) }));
  };

  const toggleDay = (memberId: number, day: string) => {
    setStaff(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const has = m.schedule.includes(day);
      return { ...m, schedule: has ? m.schedule.filter(d => d !== day) : [...m.schedule, day] };
    }));
    setScheduleMember(prev => {
      if (!prev || prev.id !== memberId) return prev;
      const has = prev.schedule.includes(day);
      return { ...prev, schedule: has ? prev.schedule.filter(d => d !== day) : [...prev.schedule, day] };
    });
  };

  const handleAdd = () => {
    if (!addForm.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const newMember: StaffMember = {
      id: Date.now(),
      name: addForm.name.trim(),
      role: addForm.role || "Technician",
      email: addForm.email,
      phone: addForm.phone,
      specialties: addForm.specialties.split(",").map(s => s.trim()).filter(Boolean),
      station: addForm.station,
      commissionRate: Number(addForm.commissionRate) || 40,
      rating: 5.0,
      appointments: 0,
      status: "active",
      avatar: makeAvatar(addForm.name.trim()),
      bio: "",
      schedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      recentAppointments: [],
    };
    setStaff(prev => [...prev, newMember]);
    setAddForm({ name: "", role: "", email: "", phone: "", specialties: "", station: "", commissionRate: "40" });
    setShowNew(false);
    toast({ title: `${newMember.name} added to staff!` });
  };

  const statusInfo = (s: string) => STATUSES.find(x => x.value === s) || STATUSES[0];

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
        <Input placeholder="Search staff..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
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
                    <Badge variant={statusInfo(member.status).color} className="capitalize shrink-0 text-[10px]">
                      {member.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  {member.station && <p className="text-xs text-muted-foreground">{member.station}</p>}
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
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>{member.commissionRate}%</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {member.specialties.map(s => (
                  <Badge key={s} variant="outline" className="text-xs border-white/10 text-white/70">{s}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setScheduleMember(member); }}>Schedule</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openProfile(member)}>Profile</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Full Profile Dialog ── */}
      <Dialog open={!!viewMember} onOpenChange={open => { if (!open) { setViewMember(null); setEditMode(false); } }}>
        <DialogContent className="bg-card border-white/10 max-w-2xl p-0 overflow-hidden">
          {viewMember && (
            <>
              {/* Header bar */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-black font-bold text-xl shrink-0">
                    {editMode ? makeAvatar(editForm.name || viewMember.name) : viewMember.avatar}
                  </div>
                  <div>
                    {editMode
                      ? <Input className="h-8 text-lg font-semibold bg-white/5 border-white/20 text-white mb-1 w-56" value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      : <h2 className="text-xl font-semibold text-white">{viewMember.name}</h2>}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-primary text-sm">
                        <Star className="w-3.5 h-3.5 fill-primary" />{viewMember.rating}
                      </div>
                      <span className="text-muted-foreground text-xs">{viewMember.appointments} appointments</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <>
                      <Button variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                      <Button variant="gold" size="sm" onClick={saveEdit}>Save Changes</Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1" onClick={startEdit}>
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              <ScrollArea className="max-h-[70vh]">
                <div className="px-6 py-5 space-y-6">

                  {/* Identity */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Identity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Role / Title</Label>
                        {editMode
                          ? <Input value={editForm.role || ""} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Lead Technician" />
                          : <p className="text-white text-sm">{viewMember.role}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        {editMode ? (
                          <div className="flex gap-2">
                            {STATUSES.map(s => (
                              <button
                                key={s.value}
                                onClick={() => setEditForm(f => ({ ...f, status: s.value }))}
                                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${editForm.status === s.value ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30"}`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <Badge variant={statusInfo(viewMember.status).color} className="capitalize">
                            {viewMember.status.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Contact */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
                        {editMode
                          ? <Input type="email" value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="tech@salon.com" />
                          : <p className="text-white text-sm">{viewMember.email || "—"}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
                        {editMode
                          ? <Input type="tel" value={editForm.phone || ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" />
                          : <p className="text-white text-sm">{viewMember.phone || "—"}</p>}
                      </div>
                    </div>
                  </section>

                  {/* Work Details */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Work Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Station</Label>
                        {editMode
                          ? <Input value={editForm.station || ""} onChange={e => setEditForm(f => ({ ...f, station: e.target.value }))} placeholder="e.g. Station 1" />
                          : <p className="text-white text-sm">{viewMember.station || "—"}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Commission Rate</Label>
                        {editMode
                          ? <div className="flex items-center gap-2">
                              <Input type="number" min={0} max={100} value={editForm.commissionRate ?? 0} onChange={e => setEditForm(f => ({ ...f, commissionRate: Number(e.target.value) }))} className="w-24" />
                              <span className="text-muted-foreground text-sm">%</span>
                            </div>
                          : <p className="text-white text-sm">{viewMember.commissionRate}%</p>}
                      </div>
                    </div>
                  </section>

                  {/* Specialties */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(editMode ? editForm.specialties : viewMember.specialties)?.map((s, i) => (
                        <Badge key={i} variant="outline" className="border-primary/30 text-primary gap-1.5 pr-1">
                          {s}
                          {editMode && (
                            <button onClick={() => removeSpecialty(i)} className="hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {(!editMode && !viewMember.specialties.length) && <p className="text-sm text-muted-foreground">None listed.</p>}
                    </div>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add specialty..."
                          value={newSpecialty}
                          onChange={e => setNewSpecialty(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpecialty(); } }}
                          className="h-8 text-sm"
                        />
                        <Button variant="outline" size="sm" onClick={addSpecialty}>Add</Button>
                      </div>
                    )}
                  </section>

                  {/* Bio */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Bio</h3>
                    {editMode
                      ? <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-primary/50 leading-relaxed"
                          rows={4}
                          value={editForm.bio || ""}
                          onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                          placeholder="Write a short bio for this technician..."
                        />
                      : <p className="text-sm text-white/80 leading-relaxed">{viewMember.bio || "No bio yet."}</p>}
                  </section>

                  {/* Recent Appointments (read-only) */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Recent Appointments</h3>
                    {viewMember.recentAppointments.length === 0
                      ? <p className="text-sm text-muted-foreground">No recent appointments.</p>
                      : viewMember.recentAppointments.map((a, i) => (
                        <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3 mb-2 text-sm">
                          <div>
                            <p className="text-white font-medium">{a.client}</p>
                            <p className="text-muted-foreground text-xs">{a.service} · {a.date}</p>
                          </div>
                          <span className="text-primary font-semibold">${a.amount}</span>
                        </div>
                      ))}
                  </section>

                  {/* Danger zone */}
                  {editMode && (
                    <section className="border border-red-500/20 rounded-xl p-4 bg-red-500/5">
                      <h3 className="text-xs uppercase tracking-widest text-red-400 mb-3">Danger Zone</h3>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-orange-400 border-orange-400/20 hover:bg-orange-400/10"
                          onClick={() => { setEditForm(f => ({ ...f, status: "on_leave" })); toast({ title: "Status set to On Leave" }); }}
                        >
                          <UserX className="w-4 h-4" /> Set On Leave
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-red-400 border-red-400/20 hover:bg-red-400/10"
                          onClick={() => {
                            setStaff(prev => prev.filter(m => m.id !== viewMember.id));
                            setViewMember(null);
                            toast({ title: `${viewMember.name} removed from staff` });
                          }}
                        >
                          <X className="w-4 h-4" /> Remove Staff Member
                        </Button>
                      </div>
                    </section>
                  )}

                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Schedule Dialog ── */}
      <Dialog open={!!scheduleMember} onOpenChange={open => { if (!open) setScheduleMember(null); }}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          {scheduleMember && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white font-display text-2xl">{scheduleMember.name}'s Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-1">
                <p className="text-sm text-muted-foreground">Toggle working days. Click Save to confirm.</p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map(day => {
                    const isOn = scheduleMember.schedule.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(scheduleMember.id, day)}
                        className={`flex flex-col items-center py-3 rounded-xl border text-xs font-semibold transition-all ${isOn ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/30"}`}
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

      {/* ── Add Staff Dialog ── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Full Name *</Label>
                <Input placeholder="e.g. Maya Johnson" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input placeholder="e.g. Lead Technician" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Station</Label>
                <Input placeholder="e.g. Station 4" value={addForm.station} onChange={e => setAddForm({ ...addForm, station: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="tech@salon.com" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="(555) 000-0000" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Specialties</Label>
                <Input placeholder="Gel-X, Nail Art, Pedicure" value={addForm.specialties} onChange={e => setAddForm({ ...addForm, specialties: e.target.value })} />
                <p className="text-xs text-muted-foreground">Separate with commas</p>
              </div>
              <div className="space-y-2">
                <Label>Commission Rate (%)</Label>
                <Input type="number" min={0} max={100} value={addForm.commissionRate} onChange={e => setAddForm({ ...addForm, commissionRate: e.target.value })} />
              </div>
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
