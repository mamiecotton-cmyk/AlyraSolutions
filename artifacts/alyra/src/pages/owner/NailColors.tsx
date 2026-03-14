import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Button, Input, Badge } from "@/components/ui";
import { UserRole } from "@workspace/api-client-react";
import { MOCK_COLORS } from "@/lib/mock-data";
import { Search, Plus, Sparkles, Droplet } from "lucide-react";
import { motion } from "framer-motion";

export function NailColors() {
  const [search, setSearch] = useState("");
  
  const filtered = MOCK_COLORS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout requiredRole={UserRole.salon_owner}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-display text-white mb-2">Color Inventory</h1>
          <p className="text-muted-foreground">Manage your physical collection and virtual try-on catalog.</p>
        </div>
        <Button variant="gold" className="gap-2"><Plus className="w-4 h-4" /> Add Color</Button>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search by name, brand, or hex..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">All Finishes</Button>
          <Button variant="outline">In Stock</Button>
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
            <Card className="glass-panel overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
              <div 
                className="h-32 w-full relative"
                style={{ backgroundColor: color.colorCode }}
              >
                {/* Simulated finish effects */}
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
      </div>
    </DashboardLayout>
  );
}
