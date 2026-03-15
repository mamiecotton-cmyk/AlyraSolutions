import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { MOCK_SERVICES, SalonService } from "@/lib/mock-data";
import { Plus, Pencil, Trash2, Clock, DollarSign, ToggleLeft, ToggleRight, Scissors } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = ["Manicure", "Pedicure", "Extensions", "Nail Art", "Treatments", "Add-ons"];

const CATEGORY_COLORS: Record<string, string> = {
  Manicure:   "bg-pink-500/15 text-pink-300 border-pink-500/20",
  Pedicure:   "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Extensions: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  "Nail Art": "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Treatments: "bg-green-500/15 text-green-300 border-green-500/20",
  "Add-ons":  "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

const EMPTY_FORM = { name: "", category: "Manicure", duration: 60, price: 0, description: "", active: true };

export function ServicesManager() {
  const { toast } = useToast();
  const [services, setServices] = useState<SalonService[]>(MOCK_SERVICES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalonService | null>(null);
  const [form, setForm] = useState<Omit<SalonService, "id">>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState<string>("All");

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (svc: SalonService) => {
    setEditing(svc);
    setForm({ name: svc.name, category: svc.category, duration: svc.duration, price: svc.price, description: svc.description, active: svc.active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast({ title: "Service name is required", variant: "destructive" });
    if (form.price < 0) return toast({ title: "Price must be 0 or more", variant: "destructive" });
    if (form.duration < 5) return toast({ title: "Duration must be at least 5 minutes", variant: "destructive" });

    if (editing) {
      setServices(prev => prev.map(s => s.id === editing.id ? { ...editing, ...form } : s));
      toast({ title: "Service updated" });
    } else {
      const newId = Math.max(0, ...services.map(s => s.id)) + 1;
      setServices(prev => [...prev, { id: newId, ...form }]);
      toast({ title: "Service added" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleteConfirm(null);
    toast({ title: "Service removed" });
  };

  const toggleActive = (id: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const categories = ["All", ...CATEGORIES];
  const visible = filterCat === "All" ? services : services.filter(s => s.category === filterCat);
  const activeCount = services.filter(s => s.active).length;

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Services</h1>
          <p className="text-muted-foreground">{activeCount} active · {services.length} total — shown on your salon's booking page.</p>
        </div>
        <Button variant="gold" className="gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCat === cat
                ? "bg-primary text-black"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Scissors className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-white font-medium mb-1">No services yet</p>
          <p className="text-muted-foreground text-sm mb-6">Add your first service to display it on the booking page.</p>
          <Button variant="outline" className="gap-2" onClick={openAdd}><Plus className="w-4 h-4" /> Add Service</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(svc => (
            <Card key={svc.id} className={`bg-card border-white/5 transition-opacity ${!svc.active ? "opacity-50" : ""}`}>
              <CardContent className="p-5 flex flex-col gap-3 h-full">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold leading-tight truncate">{svc.name}</h3>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[svc.category] ?? "bg-white/5 text-white"}`}>
                      {svc.category}
                    </span>
                  </div>
                  <Switch checked={svc.active} onCheckedChange={() => toggleActive(svc.id)} />
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">{svc.description}</p>

                {/* Price / duration */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-primary font-bold text-base">
                    <DollarSign className="w-4 h-4" />{svc.price}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />{svc.duration} min
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-white/5">
                  <Button variant="ghost" size="sm" className="gap-1.5 flex-1 text-muted-foreground hover:text-white" onClick={() => openEdit(svc)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Delete service" className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setDeleteConfirm(svc.id)}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{editing ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-muted-foreground mb-1.5 block">Service Name *</Label>
              <Input
                className="bg-background border-white/10 text-white"
                placeholder="e.g. Gel Manicure"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground mb-1.5 block">Category</Label>
                <select
                  className="w-full h-9 rounded-md border border-white/10 bg-background text-white text-sm px-3"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-muted-foreground mb-1.5 block">Duration (min)</Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  className="bg-background border-white/10 text-white"
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground mb-1.5 block">Price (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  step={5}
                  className="bg-background border-white/10 text-white pl-8"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground mb-1.5 block">Description</Label>
              <Textarea
                className="bg-background border-white/10 text-white resize-none"
                rows={3}
                placeholder="Describe what's included in this service…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <Label className="text-muted-foreground">Active (shown on booking page)</Label>
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={handleSave}>
                {editing ? "Save Changes" : "Add Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Remove Service?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-1">This will remove the service from your booking page. This action cannot be undone.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
