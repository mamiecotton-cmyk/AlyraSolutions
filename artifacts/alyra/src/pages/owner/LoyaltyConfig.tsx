import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Star, Gift, Users, TrendingUp, Plus, Edit2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const TIERS = [
  { name: "Bronze", min: 0, max: 499, color: "#CD7F32", benefits: ["Birthday discount 10%", "Early access to promotions"] },
  { name: "Silver", min: 500, max: 999, color: "#C0C0C0", benefits: ["Birthday discount 15%", "Priority booking", "Free nail art with full set"] },
  { name: "Gold", min: 1000, max: 2499, color: "#D4AF37", benefits: ["Birthday discount 20%", "Priority booking", "Monthly free service", "Dedicated technician"] },
  { name: "Platinum", min: 2500, max: null, color: "#E5E4E2", benefits: ["Birthday discount 25%", "VIP priority booking", "Monthly free service", "Complimentary drinks", "Exclusive events"] },
];

const MOCK_REWARDS = [
  { id: 1, name: "Free Nail Art", points: 200, description: "Add one nail art design free", isActive: true },
  { id: 2, name: "$10 Off", points: 500, description: "$10 discount on any service", isActive: true },
  { id: 3, name: "Free Classic Manicure", points: 800, description: "Complimentary classic manicure", isActive: true },
  { id: 4, name: "$25 Off", points: 1200, description: "$25 discount on any service", isActive: false },
];

export function LoyaltyConfig() {
  const [rewards, setRewards] = useState(MOCK_REWARDS);
  const [pointsPerDollar, setPointsPerDollar] = useState(10);
  const [showNew, setShowNew] = useState(false);
  const [editingPoints, setEditingPoints] = useState(false);
  const [tempPoints, setTempPoints] = useState(String(pointsPerDollar));
  const [form, setForm] = useState({ name: "", points: "", description: "" });
  const { toast } = useToast();

  const handleToggleReward = (id: number) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    toast({ title: "Reward updated" });
  };

  const handleSavePoints = () => {
    setPointsPerDollar(Number(tempPoints) || 10);
    setEditingPoints(false);
    toast({ title: "Points rate saved" });
  };

  const handleAddReward = () => {
    if (!form.name || !form.points) { toast({ title: "Name and points are required", variant: "destructive" }); return; }
    setRewards(prev => [...prev, { id: Date.now(), name: form.name, points: Number(form.points), description: form.description, isActive: true }]);
    setForm({ name: "", points: "", description: "" });
    setShowNew(false);
    toast({ title: "Reward added!" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Loyalty Program</h1>
          <p className="text-muted-foreground">Configure tiers, rewards, and point earning rules.</p>
        </div>
        <Button variant="gold" className="gap-2" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> New Reward
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-panel">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrolled Clients</p>
              <h3 className="text-2xl font-bold text-white">218</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points Issued</p>
              <h3 className="text-2xl font-bold text-white">48.2k</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20 text-green-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rewards Redeemed</p>
              <h3 className="text-2xl font-bold text-white">124</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Points Earning Rate</span>
                {editingPoints ? (
                  <div className="flex items-center gap-2">
                    <Input className="w-20 h-8 text-sm" value={tempPoints} onChange={e => setTempPoints(e.target.value)} type="number" />
                    <Button variant="ghost" size="icon" onClick={handleSavePoints}><Check className="w-4 h-4 text-green-400" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingPoints(false)}><X className="w-4 h-4 text-red-400" /></Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setTempPoints(String(pointsPerDollar)); setEditingPoints(true); }}>
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display text-primary font-bold">{pointsPerDollar}</span>
                <span className="text-muted-foreground text-lg">points per $1 spent</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader><CardTitle>Tier Structure</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {TIERS.map(tier => (
                <div key={tier.name} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: tier.color + "30", border: `2px solid ${tier.color}50` }}>
                    <Star className="w-5 h-5" style={{ color: tier.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-semibold">{tier.name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {tier.min.toLocaleString()}–{tier.max ? tier.max.toLocaleString() : "∞"} pts
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tier.benefits.slice(0, 2).map(b => (
                        <Badge key={b} variant="outline" className="text-[10px] border-white/10">{b}</Badge>
                      ))}
                      {tier.benefits.length > 2 && <Badge variant="outline" className="text-[10px] border-white/10">+{tier.benefits.length - 2} more</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Rewards Catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rewards.map(reward => (
              <div key={reward.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{reward.name}</h4>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">{reward.points} pts</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                </div>
                <Button
                  variant={reward.isActive ? "success" : "outline"}
                  size="sm"
                  className={reward.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 ml-4" : "ml-4"}
                  onClick={() => handleToggleReward(reward.id)}
                >
                  {reward.isActive ? "Active" : "Disabled"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">New Reward</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Reward Name *</Label>
              <Input placeholder="e.g. Free Nail Art" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Points Required *</Label>
              <Input type="number" placeholder="e.g. 200" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="What the client receives" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={handleAddReward}>Add Reward</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
