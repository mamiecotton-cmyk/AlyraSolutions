import { useState } from "react";
import { useLocation } from "wouter";
import { MOCK_SALON, MOCK_SERVICES } from "@/lib/mock-data";
import { Clock, DollarSign, Sparkles, MapPin, Phone, ChevronRight, Star, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  Manicure:   "bg-pink-500/15 text-pink-300 border-pink-500/20",
  Pedicure:   "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Extensions: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  "Nail Art": "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Treatments: "bg-green-500/15 text-green-300 border-green-500/20",
  "Add-ons":  "bg-slate-500/15 text-slate-300 border-slate-500/20",
};

const ALL_CATEGORIES = ["All", "Manicure", "Pedicure", "Extensions", "Nail Art", "Treatments", "Add-ons"];

export function SalonLanding() {
  const [, setLocation] = useLocation();
  const [filterCat, setFilterCat] = useState("All");

  const activeServices = MOCK_SERVICES.filter(s => s.active);
  const visible = filterCat === "All" ? activeServices : activeServices.filter(s => s.category === filterCat);

  const presentCategories = ["All", ...ALL_CATEGORIES.slice(1).filter(c => activeServices.some(s => s.category === c))];

  return (
    <div className="min-h-screen bg-background text-white">

      {/* ── Nav ── */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display text-xl tracking-wider text-white">{MOCK_SALON.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/login")}
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Sign In
          </button>
          <Button variant="gold" size="sm" className="gap-1.5" onClick={() => setLocation("/client/book")}>
            Book Now <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        {/* decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-primary text-xs font-medium uppercase tracking-wider">Premium Nail Studio</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display mb-5 leading-tight">
            Where Nails Become<br />
            <span className="text-primary">Art</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            {MOCK_SALON.description}&nbsp;Located in {MOCK_SALON.city}, {MOCK_SALON.state}.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button variant="gold" size="lg" className="gap-2 px-8" onClick={() => setLocation("/client/book")}>
              Book an Appointment <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 px-8" onClick={() => setLocation("/try-on")}>
              <Wand2 className="w-4 h-4" /> Try Colors On Your Nails
            </Button>
            <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground" onClick={() => setLocation("/walk-in/1")}>
              Walk-In Waitlist
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{MOCK_SALON.address}, {MOCK_SALON.city}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{MOCK_SALON.phone}</span>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display mb-2">Our Services</h2>
          <p className="text-muted-foreground">Everything we offer — tap any service to book.</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {presentCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filterCat === cat
                  ? "bg-primary border-primary text-black"
                  : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map(svc => (
            <button
              key={svc.id}
              onClick={() => setLocation("/client/book")}
              className="group text-left bg-card border border-white/5 rounded-2xl p-6 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 flex flex-col gap-3"
            >
              {/* Category badge */}
              <span className={`self-start text-xs font-medium px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[svc.category] ?? "bg-white/5 text-white border-white/10"}`}>
                {svc.category}
              </span>

              {/* Name */}
              <h3 className="text-white font-semibold text-lg group-hover:text-primary transition-colors leading-snug">
                {svc.name}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">{svc.description}</p>

              {/* Price + duration + CTA row */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-bold text-lg flex items-center gap-0.5">
                    <DollarSign className="w-4 h-4" />{svc.price}
                  </span>
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />{svc.duration} min
                  </span>
                </div>
                <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-0.5">
                  Book <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No services in this category yet.</div>
        )}

        {/* CTA banner */}
        <div className="mt-14 rounded-2xl bg-primary/10 border border-primary/20 p-10 text-center">
          <h3 className="text-2xl font-display mb-3">Ready to treat yourself?</h3>
          <p className="text-muted-foreground mb-6">Book online in under a minute — no phone call needed.</p>
          <Button variant="gold" size="lg" className="px-10 gap-2" onClick={() => setLocation("/client/book")}>
            Book Now <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 text-center text-muted-foreground text-sm px-6">
        <p>© {new Date().getFullYear()} {MOCK_SALON.name} · {MOCK_SALON.address}, {MOCK_SALON.city}, {MOCK_SALON.state} · {MOCK_SALON.phone}</p>
        <p className="mt-1 text-xs opacity-50">Powered by Alyra Solutions</p>
      </footer>
    </div>
  );
}
