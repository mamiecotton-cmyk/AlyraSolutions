import { useState } from "react";
import { Card, CardContent, Input, Button, Label } from "@/components/ui";
import { UserPlus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// This page simulates what a user sees when scanning the salon's QR code
export function WalkIn() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-display text-white mb-2">You're on the list!</h1>
          <p className="text-muted-foreground text-lg mb-8">Your estimated wait time is <strong className="text-white">15 minutes</strong>.</p>
          <div className="bg-card p-6 rounded-2xl border border-white/10 inline-block">
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Your Code</p>
            <p className="text-5xl font-mono text-primary font-bold">W-892</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display text-white mb-2">Aura Luxe Studio</h1>
          <p className="text-primary tracking-widest uppercase text-sm">WALK-IN WAITLIST</p>
        </div>

        <Card className="w-full max-w-md p-8 glass-panel">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="p-3 bg-white/5 rounded-full"><UserPlus className="text-white w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-medium text-white">Join the Queue</h2>
              <p className="text-sm text-muted-foreground">Current wait: ~15 mins</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="(555) 000-0000" type="tel" />
              <p className="text-xs text-muted-foreground mt-1">We'll text you when it's your turn.</p>
            </div>
            <div className="space-y-2">
              <Label>Party Size</Label>
              <Input type="number" min="1" defaultValue="1" />
            </div>
            <Button variant="gold" className="w-full h-12 mt-4 text-lg" onClick={() => setSubmitted(true)}>
              Join Waitlist
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
