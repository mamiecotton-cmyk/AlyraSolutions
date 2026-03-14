import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { UserRole, WaitlistEntryStatus } from "@workspace/api-client-react";
import { MOCK_WAITLIST } from "@/lib/mock-data";
import { Clock, QrCode, UserPlus, Check, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WaitlistManager() {
  const [list, setList] = useState(MOCK_WAITLIST);

  const handleCall = (id: number) => {
    setList(list.map(item => item.id === id ? { ...item, status: WaitlistEntryStatus.called } : item));
  };

  const handleServe = (id: number) => {
    setList(list.map(item => item.id === id ? { ...item, status: WaitlistEntryStatus.serving } : item));
  };

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Live Waitlist</h1>
          <p className="text-muted-foreground">Current estimated wait time: <strong className="text-primary">15 mins</strong></p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><QrCode className="w-4 h-4" /> Show QR Code</Button>
          <Button variant="gold" className="gap-2"><UserPlus className="w-4 h-4" /> Add Walk-in</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Waiting Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-semibold text-white">Waiting ({list.filter(i => i.status === 'waiting').length})</h3>
            <div className="h-2 w-2 rounded-full bg-orange-400"></div>
          </div>
          
          <AnimatePresence>
            {list.filter(i => i.status === 'waiting').map(entry => (
              <motion.div key={entry.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                <WaitlistCard entry={entry} action={() => handleCall(entry.id)} actionLabel="Call Next" actionIcon={Volume2} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Called Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-semibold text-white">Called ({list.filter(i => i.status === 'called').length})</h3>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          </div>
          
          <AnimatePresence>
            {list.filter(i => i.status === 'called').map(entry => (
              <motion.div key={entry.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <WaitlistCard entry={entry} action={() => handleServe(entry.id)} actionLabel="Start Service" actionIcon={Check} isGold />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Serving Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-semibold text-white">Serving ({list.filter(i => i.status === 'serving').length})</h3>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
          
          <AnimatePresence>
            {list.filter(i => i.status === 'serving').map(entry => (
              <motion.div key={entry.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <WaitlistCard entry={entry} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

function WaitlistCard({ entry, action, actionLabel, actionIcon: Icon, isGold }: any) {
  return (
    <Card className={isGold ? "border-primary/50 shadow-lg shadow-primary/10" : "glass-panel"}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-lg font-medium text-white">{entry.clientName}</h4>
            <p className="text-sm text-muted-foreground">Party of {entry.partySize} • Walk-in</p>
          </div>
          <Badge variant="outline" className="text-xl font-display">#{entry.checkInCode.split('-')[1]}</Badge>
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
