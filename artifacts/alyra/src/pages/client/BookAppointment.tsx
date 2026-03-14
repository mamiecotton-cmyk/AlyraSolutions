import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { Check, ChevronRight, Sparkles, Scissors, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const SERVICES = [
  { id: 1, name: "Gel-X Extensions", duration: 90, price: 125, desc: "Premium soft gel extensions for perfect length." },
  { id: 2, name: "Classic Pedicure", duration: 60, price: 65, desc: "Relaxing foot soak, scrub, and polish." },
  { id: 3, name: "Russian Manicure", duration: 90, price: 150, desc: "Meticulous cuticle work for flawless results." },
];

const TIME_SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

export function BookAppointment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleConfirm = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setIsSubmitting(false);
    toast({ title: "Appointment booked! See you soon." });
    setLocation('/client');
  };

  return (
    <DashboardLayout requiredRole={UserRole.client}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-display text-white mb-2">Book Appointment</h1>
          <p className="text-muted-foreground">Glam Nails Studio • Beverly Hills</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-12 relative px-8">
          <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-white/10 -z-10 -translate-y-1/2"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-2 bg-background p-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= i ? 'bg-primary border-primary text-black' : 'bg-card border-white/10 text-muted-foreground'}`}>
                {step > i ? <Check className="w-5 h-5" /> : i}
              </div>
              <span className={`text-xs ${step >= i ? 'text-primary' : 'text-muted-foreground'}`}>
                {i === 1 ? 'Service' : i === 2 ? 'Time' : 'Confirm'}
              </span>
            </div>
          ))}
        </div>

        <Card className="glass-panel overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                <h3 className="text-xl font-medium text-white mb-6">Select a Service</h3>
                <div className="space-y-4">
                  {SERVICES.map(svc => (
                    <div 
                      key={svc.id} 
                      onClick={() => setSelectedService(svc.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedService === svc.id ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-white flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-primary" /> {svc.name}
                        </h4>
                        <span className="font-bold text-white">${svc.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{svc.desc}</p>
                      <Badge variant="outline" className="text-xs text-muted-foreground border-white/10"><Clock className="w-3 h-3 mr-1"/> {svc.duration} mins</Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                <h3 className="text-xl font-medium text-white mb-6">Choose a Time</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {TIME_SLOTS.map(time => (
                    <Button 
                      key={time}
                      variant={selectedTime === time ? "gold" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className="h-14 text-base"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-display text-white mb-2">Review & Confirm</h2>
                <p className="text-muted-foreground mb-8">Almost there! Please review your details below.</p>
                
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-left mb-8 max-w-md mx-auto">
                  <div className="flex justify-between mb-4 pb-4 border-b border-white/10">
                    <span className="text-muted-foreground">Service</span>
                    <span className="text-white font-medium">{SERVICES.find(s=>s.id===selectedService)?.name}</span>
                  </div>
                  <div className="flex justify-between mb-4 pb-4 border-b border-white/10">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="text-white font-medium">Tomorrow, {selectedTime}</span>
                  </div>
                  <div className="flex justify-between mb-4 pb-4 border-b border-white/10">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-white font-medium">Glam Nails Studio</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-primary font-bold text-xl">${SERVICES.find(s=>s.id===selectedService)?.price}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 bg-black/40 border-t border-white/10 flex justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1}>Back</Button>
            {step < 3 ? (
              <Button variant="gold" onClick={handleNext} disabled={(step === 1 && !selectedService) || (step === 2 && !selectedTime)}>
                Next Step <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="gold" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
