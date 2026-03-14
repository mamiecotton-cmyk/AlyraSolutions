import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { UserRole, AppointmentStatus } from "@workspace/api-client-react";
import { formatTime } from "@/lib/utils";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { Calendar, Clock, MapPin, MessageSquare, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function daysFromNow(n: number, h = 10, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

// ── Extended mock appointments for Maya (technicianId = 3) ───────────────────

const EXTRA_APPOINTMENTS = [
  // ── Yesterday ──
  { id: 201, clientName: "Ava Williams", scheduledAt: daysAgo(1, 9, 0),  services: [{ serviceId: 1, name: "Gel-X Extensions",   duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  { id: 202, clientName: "Luna Park",    scheduledAt: daysAgo(1, 13, 0), services: [{ serviceId: 3, name: "Russian Manicure",    duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  // ── 2 days ago ──
  { id: 203, clientName: "Nora Ellis",   scheduledAt: daysAgo(2, 10, 30),services: [{ serviceId: 4, name: "Nail Art Design",     duration: 60, price: 85  }], status: AppointmentStatus.completed, totalAmount: 85  },
  { id: 204, clientName: "Zoe Carter",   scheduledAt: daysAgo(2, 15, 0), services: [{ serviceId: 1, name: "Gel-X Extensions",   duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  // ── 3 days ago ──
  { id: 205, clientName: "Mia Foster",   scheduledAt: daysAgo(3, 11, 0), services: [{ serviceId: 2, name: "Classic Manicure",   duration: 45, price: 45  }], status: AppointmentStatus.completed, totalAmount: 45  },
  // ── 4 days ago ──
  { id: 206, clientName: "Ella Reed",    scheduledAt: daysAgo(4, 9, 30), services: [{ serviceId: 3, name: "Russian Manicure",   duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  { id: 207, clientName: "Isla Grant",   scheduledAt: daysAgo(4, 14, 0), services: [{ serviceId: 4, name: "Nail Art Design",    duration: 60, price: 85  }], status: AppointmentStatus.completed, totalAmount: 85  },
  // ── 5 days ago ──
  { id: 208, clientName: "Cora Mitchell",scheduledAt: daysAgo(5, 10, 0), services: [{ serviceId: 1, name: "Gel-X Extensions",  duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  // ── 6 days ago ──
  { id: 209, clientName: "Ruby Hayes",   scheduledAt: daysAgo(6, 13, 30),services: [{ serviceId: 2, name: "Classic Manicure",  duration: 45, price: 45  }], status: AppointmentStatus.completed, totalAmount: 45  },

  // ── 8–29 days ago (this month, before this week) ──
  { id: 210, clientName: "Harper Quinn", scheduledAt: daysAgo(9, 10, 0), services: [{ serviceId: 3, name: "Russian Manicure",  duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  { id: 211, clientName: "Lily Adams",   scheduledAt: daysAgo(9, 14, 0), services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  { id: 212, clientName: "Stella Cruz",  scheduledAt: daysAgo(11, 9, 0), services: [{ serviceId: 4, name: "Nail Art Design",  duration: 60, price: 85  }], status: AppointmentStatus.completed, totalAmount: 85  },
  { id: 213, clientName: "Violet Shaw",  scheduledAt: daysAgo(14, 11, 0),services: [{ serviceId: 2, name: "Classic Manicure", duration: 45, price: 45  }], status: AppointmentStatus.completed, totalAmount: 45  },
  { id: 214, clientName: "Grace Kim",    scheduledAt: daysAgo(14, 15, 0),services: [{ serviceId: 3, name: "Russian Manicure", duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  { id: 215, clientName: "Piper Ward",   scheduledAt: daysAgo(16, 10, 0),services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  { id: 216, clientName: "Nadia Rose",   scheduledAt: daysAgo(19, 13, 0),services: [{ serviceId: 4, name: "Nail Art Design",  duration: 60, price: 85  }], status: AppointmentStatus.completed, totalAmount: 85  },
  { id: 217, clientName: "Tara Bloom",   scheduledAt: daysAgo(21, 9, 30),services: [{ serviceId: 2, name: "Classic Manicure", duration: 45, price: 45  }], status: AppointmentStatus.completed, totalAmount: 45  },
  { id: 218, clientName: "Dana Cole",    scheduledAt: daysAgo(25, 11, 0),services: [{ serviceId: 3, name: "Russian Manicure", duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  { id: 219, clientName: "Faye Long",    scheduledAt: daysAgo(25, 14, 30),services:[{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  { id: 220, clientName: "Sage Perry",   scheduledAt: daysAgo(28, 10, 0),services: [{ serviceId: 4, name: "Nail Art Design",  duration: 60, price: 85  }], status: AppointmentStatus.completed, totalAmount: 85  },

  // ── 30–60 days ago (last month) ──
  { id: 230, clientName: "Wren Bell",    scheduledAt: daysAgo(31, 10, 0), services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  { id: 231, clientName: "Jade Stone",   scheduledAt: daysAgo(33, 13, 0), services: [{ serviceId: 3, name: "Russian Manicure", duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  { id: 232, clientName: "Lena Fox",     scheduledAt: daysAgo(35, 9, 30), services: [{ serviceId: 2, name: "Classic Manicure", duration: 45, price: 45  }], status: AppointmentStatus.completed, totalAmount: 45  },
  { id: 233, clientName: "Mara Lake",    scheduledAt: daysAgo(38, 11, 0), services: [{ serviceId: 4, name: "Nail Art Design",  duration: 60, price: 85  }], status: AppointmentStatus.completed, totalAmount: 85  },
  { id: 234, clientName: "Remy Hart",    scheduledAt: daysAgo(40, 14, 0), services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  { id: 235, clientName: "Sasha Moore",  scheduledAt: daysAgo(42, 10, 0), services: [{ serviceId: 3, name: "Russian Manicure", duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  { id: 236, clientName: "Cleo Nash",    scheduledAt: daysAgo(45, 9, 0),  services: [{ serviceId: 2, name: "Classic Manicure", duration: 45, price: 45  }], status: AppointmentStatus.completed, totalAmount: 45  },
  { id: 237, clientName: "Bex Flynn",    scheduledAt: daysAgo(48, 13, 30),services: [{ serviceId: 4, name: "Nail Art Design",  duration: 60, price: 85  }], status: AppointmentStatus.completed, totalAmount: 85  },
  { id: 238, clientName: "Ivy Cross",    scheduledAt: daysAgo(52, 10, 0), services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.completed, totalAmount: 125 },
  { id: 239, clientName: "Zara Hunt",    scheduledAt: daysAgo(55, 14, 0), services: [{ serviceId: 3, name: "Russian Manicure", duration: 90, price: 150 }], status: AppointmentStatus.completed, totalAmount: 150 },
  { id: 240, clientName: "Opal West",    scheduledAt: daysAgo(58, 11, 30),services: [{ serviceId: 2, name: "Classic Manicure", duration: 45, price: 45  }], status: AppointmentStatus.completed, totalAmount: 45  },

  // ── Upcoming (rest of week) ──
  { id: 301, clientName: "Aria Walsh",   scheduledAt: daysFromNow(1, 10, 0), services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.confirmed, totalAmount: 125 },
  { id: 302, clientName: "Petra Lane",   scheduledAt: daysFromNow(1, 14, 0), services: [{ serviceId: 3, name: "Russian Manicure", duration: 90, price: 150 }], status: AppointmentStatus.confirmed, totalAmount: 150 },
  { id: 303, clientName: "Demi Knox",    scheduledAt: daysFromNow(2, 11, 0), services: [{ serviceId: 4, name: "Nail Art Design",  duration: 60, price: 85  }], status: AppointmentStatus.pending,   totalAmount: 85  },
  { id: 304, clientName: "Fiona Marsh",  scheduledAt: daysFromNow(3, 9, 30), services: [{ serviceId: 2, name: "Classic Manicure", duration: 45, price: 45  }], status: AppointmentStatus.pending,   totalAmount: 45  },
  { id: 305, clientName: "Leah Rowe",    scheduledAt: daysFromNow(4, 13, 0), services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }], status: AppointmentStatus.pending,   totalAmount: 125 },

  // ── Next month (days 5–31 from now) ──
  { id: 401, clientName: "Camille Ross",  scheduledAt: daysFromNow(5, 10, 0),  services: [{ serviceId: 3, name: "Russian Manicure",  duration: 90, price: 150 }], status: AppointmentStatus.confirmed, totalAmount: 150 },
  { id: 402, clientName: "Naomi Banks",   scheduledAt: daysFromNow(5, 14, 0),  services: [{ serviceId: 1, name: "Gel-X Extensions",  duration: 90, price: 125 }], status: AppointmentStatus.confirmed, totalAmount: 125 },
  { id: 403, clientName: "Elara Voss",    scheduledAt: daysFromNow(7, 9, 30),  services: [{ serviceId: 4, name: "Nail Art Design",   duration: 60, price: 85  }], status: AppointmentStatus.pending,   totalAmount: 85  },
  { id: 404, clientName: "Seren Bell",    scheduledAt: daysFromNow(7, 13, 0),  services: [{ serviceId: 2, name: "Classic Manicure",  duration: 45, price: 45  }], status: AppointmentStatus.pending,   totalAmount: 45  },
  { id: 405, clientName: "Thea Dunn",     scheduledAt: daysFromNow(9, 10, 0),  services: [{ serviceId: 1, name: "Gel-X Extensions",  duration: 90, price: 125 }], status: AppointmentStatus.confirmed, totalAmount: 125 },
  { id: 406, clientName: "Rosa Klein",    scheduledAt: daysFromNow(11, 11, 0), services: [{ serviceId: 3, name: "Russian Manicure",  duration: 90, price: 150 }], status: AppointmentStatus.pending,   totalAmount: 150 },
  { id: 407, clientName: "Vivi Stone",    scheduledAt: daysFromNow(14, 9, 0),  services: [{ serviceId: 4, name: "Nail Art Design",   duration: 60, price: 85  }], status: AppointmentStatus.pending,   totalAmount: 85  },
  { id: 408, clientName: "Quinn Ash",     scheduledAt: daysFromNow(14, 14, 30),services: [{ serviceId: 1, name: "Gel-X Extensions",  duration: 90, price: 125 }], status: AppointmentStatus.confirmed, totalAmount: 125 },
  { id: 409, clientName: "Mina Foley",    scheduledAt: daysFromNow(16, 10, 0), services: [{ serviceId: 2, name: "Classic Manicure",  duration: 45, price: 45  }], status: AppointmentStatus.pending,   totalAmount: 45  },
  { id: 410, clientName: "Ines Hart",     scheduledAt: daysFromNow(18, 11, 0), services: [{ serviceId: 3, name: "Russian Manicure",  duration: 90, price: 150 }], status: AppointmentStatus.pending,   totalAmount: 150 },
  { id: 411, clientName: "Lyra Cole",     scheduledAt: daysFromNow(21, 9, 30), services: [{ serviceId: 1, name: "Gel-X Extensions",  duration: 90, price: 125 }], status: AppointmentStatus.confirmed, totalAmount: 125 },
  { id: 412, clientName: "Bria Noel",     scheduledAt: daysFromNow(21, 13, 0), services: [{ serviceId: 4, name: "Nail Art Design",   duration: 60, price: 85  }], status: AppointmentStatus.pending,   totalAmount: 85  },
  { id: 413, clientName: "Cass Reid",     scheduledAt: daysFromNow(23, 10, 0), services: [{ serviceId: 2, name: "Classic Manicure",  duration: 45, price: 45  }], status: AppointmentStatus.pending,   totalAmount: 45  },
  { id: 414, clientName: "Willa Young",   scheduledAt: daysFromNow(25, 14, 0), services: [{ serviceId: 3, name: "Russian Manicure",  duration: 90, price: 150 }], status: AppointmentStatus.confirmed, totalAmount: 150 },
  { id: 415, clientName: "Pax Monroe",    scheduledAt: daysFromNow(28, 11, 30),services: [{ serviceId: 1, name: "Gel-X Extensions",  duration: 90, price: 125 }], status: AppointmentStatus.pending,   totalAmount: 125 },
  { id: 416, clientName: "Andie Cross",   scheduledAt: daysFromNow(30, 10, 0), services: [{ serviceId: 4, name: "Nail Art Design",   duration: 60, price: 85  }], status: AppointmentStatus.pending,   totalAmount: 85  },
];

const allTechApts = [
  ...MOCK_APPOINTMENTS.filter(a => a.technicians.some(t => t.technicianId === 3)).map(a => ({ ...a })),
  ...EXTRA_APPOINTMENTS.map(a => ({
    ...a, id: a.id, salonId: 1, clientId: 99, clientPhone: "",
    technicians: [{ technicianId: 3, firstName: "Maya", lastName: "Johnson", role: "primary" }],
    estimatedEndAt: a.scheduledAt, nailColorId: undefined, createdAt: a.scheduledAt, updatedAt: a.scheduledAt,
  })),
].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

// ── Date range helpers ───────────────────────────────────────────────────────

function getRange(view: string) {
  const now = new Date();
  const todayStart = startOfDay(now);

  if (view === "today") {
    const end = new Date(todayStart); end.setDate(end.getDate() + 1);
    return { from: todayStart, to: end };
  }
  if (view === "week") {
    const from = new Date(todayStart); from.setDate(from.getDate() - 6);
    const to = new Date(todayStart); to.setDate(to.getDate() + 1);
    return { from, to };
  }
  if (view === "month") {
    const from = new Date(todayStart); from.setDate(from.getDate() - 29);
    const to = new Date(todayStart); to.setDate(to.getDate() + 1);
    return { from, to };
  }
  if (view === "past") {
    // past month: 30–60 days ago
    const to = new Date(todayStart); to.setDate(to.getDate() - 29);
    const from = new Date(todayStart); from.setDate(from.getDate() - 60);
    return { from, to };
  }
  // next month: days 1–31 from tomorrow
  const from = new Date(todayStart); from.setDate(from.getDate() + 1);
  const to = new Date(todayStart); to.setDate(to.getDate() + 32);
  return { from, to };
}

function formatDayLabel(date: Date) {
  const now = new Date();
  if (sameDay(date, now)) return "Today";
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(date, tomorrow)) return "Tomorrow";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

type View = "today" | "week" | "month" | "past" | "next";

const VIEWS: { key: View; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "past",  label: "Past Month" },
  { key: "next",  label: "Next Month" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function TechDashboard() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("today");
  const [appointments, setAppointments] = useState(allTechApts as any[]);
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
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: AppointmentStatus.completed } : a
    ));
    toast({ title: "Service completed! Great work." });
  };

  const handleMessage = (apt: any) => {
    toast({ title: `Opening message to ${apt.clientName}...` });
  };

  const handleBlockTime = () => {
    setShowBlockTime(false);
    toast({ title: "Time blocked successfully" });
  };

  // Filter and group appointments by date
  const { from, to } = getRange(view);
  const filtered = appointments.filter(a => {
    const d = new Date(a.scheduledAt);
    return d >= from && d < to;
  });

  // Group by calendar day
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    // reverse for past views so newest appears first; forward for upcoming
    const sorted = [...filtered].sort((a, b) => {
      const diff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      return view === "past" ? -diff : diff;
    });
    sorted.forEach(apt => {
      const key = startOfDay(new Date(apt.scheduledAt)).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(apt);
    });
    return map;
  }, [filtered, view]);

  const isToday = view === "today";
  const totalEarned = filtered.filter(a => a.status === AppointmentStatus.completed)
    .reduce((s, a) => s + (a.totalAmount ?? 0), 0);
  const totalBooked = filtered.reduce((s, a) => s + (a.totalAmount ?? 0), 0);

  const subtitleMap: Record<View, string> = {
    today: `${filtered.length} appointment${filtered.length !== 1 ? "s" : ""} today`,
    week:  `${filtered.length} appointments this week · $${totalEarned} earned`,
    month: `${filtered.length} appointments this month · $${totalEarned} earned`,
    past:  `${filtered.length} appointments last month · $${totalEarned} earned`,
    next:  `${filtered.length} appointments coming up · $${totalBooked} booked`,
  };

  return (
    <DashboardLayout requiredRole={UserRole.technician}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">My Schedule</h1>
          <p className="text-muted-foreground">{subtitleMap[view]}</p>
        </div>
        {isToday && (
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
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-8">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === v.key
                ? "bg-primary text-black"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Stats row for non-today views */}
      {!isToday && (
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{filtered.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Appointments</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              ${view === "next" ? totalBooked : totalEarned}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{view === "next" ? "Booked" : "Earned"}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">
              {filtered.length > 0 ? `$${Math.round((view === "next" ? totalBooked : totalEarned) / filtered.length)}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avg / Appt</p>
          </div>
        </div>
      )}

      {/* Appointment list */}
      <div className="max-w-4xl space-y-8">
        {grouped.size === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No appointments {view === "today" ? "today" : "in this period"}.</p>
          </div>
        )}

        {[...grouped.entries()].map(([dayKey, apts]) => {
          const dayDate = new Date(dayKey);
          const isDayToday = sameDay(dayDate, new Date());
          return (
            <div key={dayKey}>
              {/* Day header (only shown in multi-day views) */}
              {!isToday && (
                <div className="flex items-center gap-3 mb-3">
                  <h3 className={`text-sm font-semibold ${isDayToday ? "text-primary" : "text-white"}`}>
                    {formatDayLabel(dayDate)}
                  </h3>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-muted-foreground">{apts.length} appt{apts.length !== 1 ? "s" : ""}</span>
                </div>
              )}

              <div className="space-y-4">
                {apts.map((apt) => (
                  <Card key={apt.id} className={`glass-panel overflow-hidden border-l-4 ${apt.status === "in_progress" ? "border-l-primary" : apt.status === "completed" ? "border-l-green-500" : "border-l-white/10"}`}>
                    <CardContent className="p-0 flex flex-col md:flex-row">
                      {/* Time column */}
                      <div className="p-5 md:w-44 bg-white/5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 shrink-0">
                        <span className="text-2xl font-bold text-white mb-1">
                          {apt.startedAt
                            ? apt.startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : formatTime(apt.scheduledAt)}
                        </span>
                        {apt.startedAt
                          ? <span className="text-xs text-primary flex items-center gap-1"><Clock className="w-3 h-3" /> Started now</span>
                          : <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.services[0]?.duration} mins</span>}
                      </div>

                      {/* Details column */}
                      <div className="p-5 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="text-lg font-medium text-white">{apt.clientName}</h3>
                          <Badge variant={apt.status === "in_progress" ? "gold" : apt.status === "completed" ? "success" : "outline"}>
                            {apt.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-primary font-medium mb-3 text-sm">{apt.services.map((s: any) => s.name).join(", ")}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 text-sm">
                            {isDayToday && (
                              <Button variant="ghost" size="sm" className="gap-1.5 px-0 text-muted-foreground hover:text-white h-auto" onClick={() => handleMessage(apt)}>
                                <MessageSquare className="w-4 h-4" /> Message
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="gap-1.5 px-0 text-muted-foreground hover:text-white h-auto">
                              <MapPin className="w-4 h-4" /> Station 3
                            </Button>
                          </div>
                          <span className="text-white font-semibold text-sm">${apt.totalAmount}</span>
                        </div>
                      </div>

                      {/* Action column — only for today's appointments */}
                      {isDayToday && (
                        <div className="p-5 flex items-center justify-end bg-white/5 border-t md:border-t-0 md:border-l border-white/5 shrink-0">
                          {(apt.status === "pending" || apt.status === "confirmed") ? (
                            <Button variant="gold" size="sm" onClick={() => handleStartService(apt.id)}>Start Service</Button>
                          ) : apt.status === "in_progress" ? (
                            <Button size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30" onClick={() => handleComplete(apt.id)}>
                              Complete
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" disabled>Completed</Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Block Time dialog */}
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
