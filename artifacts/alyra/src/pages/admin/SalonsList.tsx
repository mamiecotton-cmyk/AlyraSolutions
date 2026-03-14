import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Building2, Plus, Search, ExternalLink, Settings, ToggleLeft, ToggleRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const MOCK_SALONS = [
  { id: 1, name: "Glam Nails Studio", subdomain: "glamnails", city: "Beverly Hills, CA", status: "active", clients: 342, revenue: "$12,450", joined: "Jan 2024" },
  { id: 2, name: "Luxe Beauty Spa", subdomain: "luxebeauty", city: "Los Angeles, CA", status: "active", clients: 218, revenue: "$8,320", joined: "Feb 2024" },
  { id: 3, name: "Pink Studio", subdomain: "pinkstudio", city: "Santa Monica, CA", status: "active", clients: 189, revenue: "$6,110", joined: "Mar 2024" },
  { id: 4, name: "Velvet Nails", subdomain: "velvetnails", city: "Malibu, CA", status: "suspended", clients: 45, revenue: "$1,200", joined: "Apr 2024" },
];

export function SalonsList() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [salons, setSalons] = useState(MOCK_SALONS);
  const [form, setForm] = useState({ name: "", subdomain: "", city: "", ownerEmail: "" });
  const { toast } = useToast();

  const filtered = salons.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.subdomain.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id: number) => {
    setSalons(prev => prev.map(s =>
      s.id === id ? { ...s, status: s.status === "active" ? "suspended" : "active" } : s
    ));
    const salon = salons.find(s => s.id === id);
    toast({ title: salon?.status === "active" ? "Salon suspended" : "Salon reactivated" });
  };

  const handleCreate = () => {
    if (!form.name || !form.subdomain) {
      toast({ title: "Name and subdomain are required", variant: "destructive" });
      return;
    }
    setSalons(prev => [...prev, {
      id: Date.now(),
      name: form.name,
      subdomain: form.subdomain,
      city: form.city || "—",
      status: "active",
      clients: 0,
      revenue: "$0",
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }]);
    setForm({ name: "", subdomain: "", city: "", ownerEmail: "" });
    setShowNew(false);
    toast({ title: "Salon created successfully" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.platform_admin}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">All Salons</h1>
          <p className="text-muted-foreground">{salons.filter(s => s.status === "active").length} active salons on the platform.</p>
        </div>
        <Button variant="gold" className="gap-2" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> New Salon
        </Button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search salons..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="glass-panel">
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {filtered.map(salon => (
              <div key={salon.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{salon.name}</h4>
                    <p className="text-sm text-muted-foreground">{salon.subdomain}.alyra.app • {salon.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center hidden md:block">
                    <p className="text-white font-semibold">{salon.clients}</p>
                    <p className="text-muted-foreground">Clients</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-white font-semibold">{salon.revenue}</p>
                    <p className="text-muted-foreground">Revenue</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-white font-semibold">{salon.joined}</p>
                    <p className="text-muted-foreground">Joined</p>
                  </div>
                  <Badge variant={salon.status === "active" ? "success" : "destructive"} className="capitalize">
                    {salon.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(salon.id)}
                      title={salon.status === "active" ? "Suspend salon" : "Reactivate salon"}
                    >
                      {salon.status === "active"
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5 text-red-400" />}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <ExternalLink className="w-3 h-3" /> Manage
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Add New Salon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Salon Name *</Label>
              <Input placeholder="e.g. Glam Nails Studio" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subdomain *</Label>
              <div className="flex items-center gap-2">
                <Input placeholder="glamnails" value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/\s/g, '') })} />
                <span className="text-muted-foreground text-sm whitespace-nowrap">.alyra.app</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input placeholder="Beverly Hills, CA" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Owner Email</Label>
              <Input placeholder="owner@salon.com" value={form.ownerEmail} onChange={e => setForm({ ...form, ownerEmail: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={handleCreate}>Create Salon</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
