import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Label } from "@/components/ui/label";
import { MOCK_SALON } from "@/lib/mock-data";
import { Save, Bell, Globe, CreditCard, Palette, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export function SalonSettings() {
  const [salon, setSalon] = useState({
    name: MOCK_SALON.name,
    subdomain: MOCK_SALON.subdomain,
    phone: MOCK_SALON.phone || "",
    address: MOCK_SALON.address || "",
    city: MOCK_SALON.city || "",
    state: MOCK_SALON.state || "",
    timezone: MOCK_SALON.timezone || "America/Los_Angeles",
  });
  const [notifications, setNotifications] = useState({
    smsReminders: true,
    emailReceipts: true,
    waitlistAlerts: true,
    loyaltyUpdates: false,
  });
  const [hours, setHours] = useState([
    { day: "Monday", open: "09:00", close: "19:00", closed: false },
    { day: "Tuesday", open: "09:00", close: "19:00", closed: false },
    { day: "Wednesday", open: "09:00", close: "19:00", closed: false },
    { day: "Thursday", open: "09:00", close: "20:00", closed: false },
    { day: "Friday", open: "09:00", close: "20:00", closed: false },
    { day: "Saturday", open: "10:00", close: "18:00", closed: false },
    { day: "Sunday", open: "10:00", close: "16:00", closed: true },
  ]);
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Settings saved successfully!" });
  };

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your salon profile and preferences.</p>
        </div>
        <Button variant="gold" className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" /> Save All Changes
        </Button>
      </div>

      <div className="max-w-3xl space-y-8">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Salon Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Salon Name</Label>
                <Input value={salon.name} onChange={e => setSalon({ ...salon, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input value={salon.subdomain} onChange={e => setSalon({ ...salon, subdomain: e.target.value })} />
                  <span className="text-muted-foreground text-sm whitespace-nowrap">.alyra.app</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={salon.phone} onChange={e => setSalon({ ...salon, phone: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Street Address</Label>
                <Input value={salon.address} onChange={e => setSalon({ ...salon, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={salon.city} onChange={e => setSalon({ ...salon, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={salon.state} onChange={e => setSalon({ ...salon, state: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Business Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-white font-medium">{h.day}</span>
                  <Switch
                    checked={!h.closed}
                    onCheckedChange={(checked) => setHours(prev => prev.map((hh, ii) => ii === i ? { ...hh, closed: !checked } : hh))}
                  />
                  {h.closed ? (
                    <Badge variant="outline" className="text-muted-foreground border-white/10">Closed</Badge>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Input
                        type="time"
                        value={h.open}
                        onChange={e => setHours(prev => prev.map((hh, ii) => ii === i ? { ...hh, open: e.target.value } : hh))}
                        className="w-32 h-8"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={h.close}
                        onChange={e => setHours(prev => prev.map((hh, ii) => ii === i ? { ...hh, close: e.target.value } : hh))}
                        className="w-32 h-8"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { key: "smsReminders", label: "SMS Appointment Reminders", desc: "Send SMS reminders 24h before appointments" },
              { key: "emailReceipts", label: "Email Receipts", desc: "Send email receipts after each appointment" },
              { key: "waitlistAlerts", label: "Waitlist Call Alerts", desc: "Notify clients via SMS when called from waitlist" },
              { key: "loyaltyUpdates", label: "Loyalty Point Updates", desc: "Notify clients when they earn or level up" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Billing & Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div>
                <h3 className="text-white font-semibold">Professional Plan</h3>
                <p className="text-sm text-muted-foreground">$149/month · Renews March 14, 2026</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="gold">Active</Badge>
                <Button variant="outline" size="sm">Upgrade</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
