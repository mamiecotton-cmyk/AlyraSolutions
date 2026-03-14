import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { UserRole, WaitlistEntryStatus } from "@workspace/api-client-react";
import { MOCK_WAITLIST } from "@/lib/mock-data";
import { Clock, QrCode, UserPlus, Check, Volume2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function WaitlistManager() {
  const [list, setList] = useState(MOCK_WAITLIST);
  const [showQR, setShowQR] = useState(false);
  const [showAddWalkin, setShowAddWalkin] = useState(false);
  const [walkinForm, setWalkinForm] = useState({ name: "", partySize: "1", service: "" });
  const { toast } = useToast();

  const handleCall = (id: number) => {
    setList(list.map(item => item.id === id ? { ...item, status: WaitlistEntryStatus.called } : item));
    toast({ title: "Client notified!" });
  };

  const handleServe = (id: number) => {
    setList(list.map(item => item.id === id ? { ...item, status: WaitlistEntryStatus.serving } : item));
  };

  const handleRemove = (id: number) => {
    setList(list.filter(item => item.id !== id));
    toast({ title: "Removed from waitlist" });
  };

  const handleAddWalkin = () => {
    if (!walkinForm.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const code = `W-${Math.floor(1000 + Math.random() * 9000)}`;
    setList(prev => [...prev, {
      id: Date.now(),
      salonId: 1,
      clientName: walkinForm.name,
      partySize: Number(walkinForm.partySize) || 1,
      serviceIds: [1],
      status: WaitlistEntryStatus.waiting,
      position: prev.filter(i => i.status === "waiting").length + 1,
      estimatedWaitMinutes: (prev.filter(i => i.status === "waiting").length + 1) * 15,
      checkInCode: code,
      joinedAt: new Date().toISOString(),
    }]);
    setWalkinForm({ name: "", partySize: "1", service: "" });
    setShowAddWalkin(false);
    toast({ title: `Walk-in added! Code: ${code}` });
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/walk-in/1")}`;

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Live Waitlist</h1>
          <p className="text-muted-foreground">Current estimated wait time: <strong className="text-primary">
            {list.filter(i => i.status === "waiting").length * 15} mins
          </strong></p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShowQR(true)}>
            <QrCode className="w-4 h-4" /> Show QR Code
          </Button>
          <Button variant="gold" className="gap-2" onClick={() => setShowAddWalkin(true)}>
            <UserPlus className="w-4 h-4" /> Add Walk-in
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-semibold text-white">Waiting ({list.filter(i => i.status === 'waiting').length})</h3>
            <div className="h-2 w-2 rounded-full bg-orange-400"></div>
          </div>
          <AnimatePresence>
            {list.filter(i => i.status === 'waiting').map(entry => (
              <motion.div key={entry.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                <WaitlistCard entry={entry} action={() => handleCall(entry.id)} actionLabel="Call Next" actionIcon={Volume2} onRemove={() => handleRemove(entry.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-semibold text-white">Called ({list.filter(i => i.status === 'called').length})</h3>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          </div>
          <AnimatePresence>
            {list.filter(i => i.status === 'called').map(entry => (
              <motion.div key={entry.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <WaitlistCard entry={entry} action={() => handleServe(entry.id)} actionLabel="Start Service" actionIcon={Check} isGold onRemove={() => handleRemove(entry.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-semibold text-white">Serving ({list.filter(i => i.status === 'serving').length})</h3>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
          <AnimatePresence>
            {list.filter(i => i.status === 'serving').map(entry => (
              <motion.div key={entry.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <WaitlistCard entry={entry} onRemove={() => handleRemove(entry.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-card border-white/10 max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Walk-in QR Code</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mb-4">Scan to join the waitlist at Glam Nails Studio</p>
          <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-4">
            <img src={qrUrl} alt="QR Code" className="w-56 h-56" />
          </div>
          <p className="text-xs text-muted-foreground">Display this at your reception desk or front window</p>
          <Button variant="gold" className="w-full mt-2" onClick={() => setShowQR(false)}>Done</Button>
        </DialogContent>
      </Dialog>

      {/* Add Walk-in Dialog */}
      <Dialog open={showAddWalkin} onOpenChange={setShowAddWalkin}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Add Walk-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input placeholder="e.g. Olivia Davis" value={walkinForm.name} onChange={e => setWalkinForm({ ...walkinForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Party Size</Label>
              <Input type="number" min="1" max="10" value={walkinForm.partySize} onChange={e => setWalkinForm({ ...walkinForm, partySize: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Service Requested</Label>
              <Input placeholder="e.g. Classic Manicure" value={walkinForm.service} onChange={e => setWalkinForm({ ...walkinForm, service: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddWalkin(false)}>Cancel</Button>
              <Button variant="gold" className="flex-1" onClick={handleAddWalkin}>Add to Waitlist</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function WaitlistCard({ entry, action, actionLabel, actionIcon: Icon, isGold, onRemove }: any) {
  return (
    <Card className={isGold ? "border-primary/50 shadow-lg shadow-primary/10" : "glass-panel"}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-lg font-medium text-white">{entry.clientName}</h4>
            <p className="text-sm text-muted-foreground">Party of {entry.partySize} • Walk-in</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xl font-display">#{entry.checkInCode.split('-')[1]}</Badge>
            {onRemove && (
              <button onClick={onRemove} className="text-muted-foreground hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4" />
          Wait: ~{entry.estimatedWaitMinutes}m
        </div>

        {action && (
          <Button 
            variant={isGold ? "gold" : "outline"} 
            className="w-full gap-2"
            onClick={action}
          >
            {Icon && <Icon className="w-4 h-4" />} {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
