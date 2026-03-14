import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Button, Input, Badge } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { MOCK_COLORS } from "@/lib/mock-data";
import { Search, Plus, Sparkles, Droplet, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const FINISHES = ["All", "glossy", "matte", "shimmer", "chrome"];

export function NailColors() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [finishFilter, setFinishFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState(false);
  const [colors, setColors] = useState(MOCK_COLORS);
  const [showAdd, setShowAdd] = useState(false);
  const [editingColor, setEditingColor] = useState<any>(null);
  const [form, setForm] = useState({ name: "", brand: "", colorCode: "#FF6B9D", finish: "glossy" });

  const filtered = colors.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.brand.toLowerCase().includes(search.toLowerCase());
    const matchFinish = finishFilter === "All" || c.finish === finishFilter;
    const matchStock = !stockFilter || c.inStock;
    return matchSearch && matchFinish && matchStock;
  });

  const handleAdd = () => {
    if (!form.name || !form.brand) { toast({ title: "Name and brand are required", variant: "destructive" }); return; }
    setColors(prev => [...prev, {
      id: Date.now(),
      salonId: 1,
      name: form.name,
      brand: form.brand,
      colorCode: form.colorCode,
      finish: form.finish as any,
      inStock: true,
      isPopular: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]);
    setForm({ name: "", brand: "", colorCode: "#FF6B9D", finish: "glossy" });
    setShowAdd(false);
    toast({ title: "Color added to inventory!" });
  };

  const handleToggleStock = (id: number) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, inStock: !c.inStock } : c));
    setEditingColor(null);
    toast({ title: "Stock status updated" });
  };

  const handleTogglePopular = (id: number) => {
    setColors(prev => prev.map(c => c.id === id ? { ...c, isPopular: !c.isPopular } : c));
    setEditingColor(null);
    toast({ title: "Popularity updated" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Color Inventory</h1>
          <p className="text-muted-foreground">Manage your physical collection and virtual try-on catalog.</p>
        </div>
        <Button variant="gold" className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Color
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search by name, brand..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FINISHES.map(f => (
            <Button
              key={f}
              variant={finishFilter === f ? "gold" : "outline"}
              size="sm"
              onClick={() => setFinishFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
          <Button
            variant={stockFilter ? "gold" : "outline"}
            size="sm"
            onClick={() => setStockFilter(!stockFilter)}
            className="gap-1"
          >
            {stockFilter && <Check className="w-3 h-3" />} In Stock Only
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {filtered.map((color, idx) => (
          <motion.div 
            key={color.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="glass-panel overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setEditingColor(color)}>
              <div 
                className="h-32 w-full relative"
                style={{ backgroundColor: color.colorCode }}
              >
                {color.finish === 'shimmer' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>}
                {color.finish === 'matte' && <div className="absolute inset-0 bg-black/10"></div>}
                {color.finish === 'glossy' && <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-white/30 to-transparent"></div>}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="outline" size="sm" className="gap-2">Edit</Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-white truncate pr-2">{color.name}</h4>
                  {color.isPopular && <Sparkles className="w-3 h-3 text-primary shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{color.brand} • {color.finish}</p>
                <div className="flex justify-between items-center">
                  <code className="text-[10px] text-white/50">{color.colorCode}</code>
                  {color.inStock ? (
                    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400"><Droplet className="w-3 h-3 mr-1"/> In Stock</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">Out</Badge>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <p>No colors match your search.</p>
          </div>
        )}
      </div>

      {/* Add Color Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Add New Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Color Name *</Label>
              <Input placeholder="e.g. Vampire Red" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Input placeholder="e.g. OPI" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hex Color *</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.colorCode} onChange={e => setForm({ ...form, colorCode: e.target.value })} className="w-12 h-10 rounded border border-white/10 bg-transparent cursor-pointer" />
                  <Input value={form.colorCode} onChange={e => setForm({ ...form, colorCode: e.target.value })} className="font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Finish</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-white capitalize"
                  value={form.finish}
                  onChange={e => setForm({ ...form, finish: e.target.value })}
                >
                  {["glossy", "matte", "shimmer", "chrome", "glitter"].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={handleAdd}>Add Color</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Color Dialog */}
      {editingColor && (
        <Dialog open={!!editingColor} onOpenChange={() => setEditingColor(null)}>
          <DialogContent className="bg-card border-white/10 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white font-display text-2xl">{editingColor.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl border border-white/10" style={{ backgroundColor: editingColor.colorCode }} />
              <div>
                <p className="text-white font-medium">{editingColor.brand}</p>
                <p className="text-sm text-muted-foreground capitalize">{editingColor.finish} • {editingColor.colorCode}</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                variant={editingColor.inStock ? "outline" : "gold"}
                className="w-full"
                onClick={() => handleToggleStock(editingColor.id)}
              >
                {editingColor.inStock ? "Mark as Out of Stock" : "Mark as In Stock"}
              </Button>
              <Button
                variant={editingColor.isPopular ? "outline" : "gold"}
                className="w-full"
                onClick={() => handleTogglePopular(editingColor.id)}
              >
                {editingColor.isPopular ? "Remove from Popular" : "Mark as Popular"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setEditingColor(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
