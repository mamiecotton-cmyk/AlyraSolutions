import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { MOCK_CLIENT_USER, MOCK_APPOINTMENTS, MOCK_COLORS } from "@/lib/mock-data";
import { useLocation } from "wouter";
import { Star, Gift, Calendar, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const REWARDS = [
  { id: 1, name: "Free Nail Art", points: 200 },
  { id: 2, name: "$10 Off", points: 500 },
  { id: 3, name: "Free Classic Manicure", points: 800 },
];

export function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showRedeem, setShowRedeem] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [points, setPoints] = useState(1250);
  const [cancelledAppt, setCancelledAppt] = useState(false);
  const nextAppt = MOCK_APPOINTMENTS[1];

  const handleRedeem = (reward: typeof REWARDS[0]) => {
    if (points < reward.points) {
      toast({ title: "Not enough points", variant: "destructive" });
      return;
    }
    setPoints(p => p - reward.points);
    setShowRedeem(false);
    toast({ title: `Redeemed: ${reward.name}! Show this at the front desk.` });
  };

  const handleCancel = () => {
    setCancelledAppt(true);
    setShowCancel(false);
    toast({ title: "Appointment cancelled" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.client}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome & Loyalty Banner */}
        <Card className="bg-gradient-to-r from-card to-primary/10 border-primary/20 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-64 bg-primary/20 blur-[100px]"></div>
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-display text-white mb-2">Welcome back, {MOCK_CLIENT_USER.firstName}</h1>
              <div className="flex items-center gap-3">
                <Badge variant="gold" className="px-3 py-1"><Star className="w-3 h-3 mr-1 fill-current"/> Gold Tier</Badge>
                <span className="text-sm text-muted-foreground">450 points to Platinum</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Available Points</p>
                <p className="text-4xl font-display font-bold gold-gradient-text">{points.toLocaleString()}</p>
              </div>
              <Button variant="gold" className="h-12 px-6 shadow-lg shadow-primary/20" onClick={() => setShowRedeem(true)}>
                <Gift className="w-4 h-4 mr-2"/> Redeem
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Next Appointment */}
          <Card className="glass-panel md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary"/> Upcoming Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              {cancelledAppt ? (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-center">
                  <p className="text-muted-foreground mb-4">No upcoming appointments.</p>
                  <Button variant="gold" onClick={() => setLocation('/client/book')}>Book Now</Button>
                </div>
              ) : (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Tomorrow, 2:00 PM</h3>
                    <p className="text-primary font-medium">{nextAppt.services[0]?.name}</p>
                    <p className="text-sm text-muted-foreground mt-2">with {nextAppt.technicians[0]?.firstName} at Glam Nails Studio</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setLocation('/client/book')}>Reschedule</Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none text-red-400 hover:text-red-300 hover:bg-red-400/10 border-white/5"
                      onClick={() => setShowCancel(true)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <Button onClick={() => setLocation('/client/book')} variant="gold" className="w-full mt-4">Book New Appointment</Button>
            </CardContent>
          </Card>

          {/* Favorite Colors */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-rose-400"/> Saved Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_COLORS.slice(0,3).map(color => (
                  <div key={color.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full shadow-inner border border-white/10 cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: color.colorCode }}></div>
                    <div>
                      <p className="font-medium text-white">{color.name}</p>
                      <p className="text-xs text-muted-foreground">{color.brand}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-4 text-primary hover:text-primary/80"
                onClick={() => setLocation('/client/book')}
              >
                View All Try-ons
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeem} onOpenChange={setShowRedeem}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-2xl">Redeem Rewards</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mb-4">You have <span className="text-primary font-bold">{points.toLocaleString()} points</span> available.</p>
          <div className="space-y-3">
            {REWARDS.map(reward => (
              <div key={reward.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                <div>
                  <h4 className="text-white font-medium">{reward.name}</h4>
                  <p className="text-sm text-primary">{reward.points} points</p>
                </div>
                <Button
                  variant={points >= reward.points ? "gold" : "outline"}
                  size="sm"
                  disabled={points < reward.points}
                  onClick={() => handleRedeem(reward)}
                >
                  {points >= reward.points ? "Redeem" : "Need more"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="bg-card border-white/10 max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-white font-display text-xl">Cancel Appointment?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mb-6">Are you sure you want to cancel your appointment for tomorrow at 2:00 PM? This cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancel(false)}>Keep It</Button>
            <Button variant="outline" className="flex-1 text-red-400 hover:bg-red-400/10 border-red-400/20" onClick={handleCancel}>Yes, Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
