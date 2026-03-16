import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, salonsTable, servicesTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 12);
  const [admin] = await db
    .insert(usersTable)
    .values({
      email: "admin@alyra.com",
      passwordHash: adminHash,
      firstName: "Platform",
      lastName: "Admin",
      role: "platform_admin",
      isActive: true,
    })
    .onConflictDoNothing({ target: usersTable.email })
    .returning();
  console.log("Platform admin:", admin?.email ?? "(already exists)");

  const ownerHash = await bcrypt.hash("owner123", 12);
  const [owner] = await db
    .insert(usersTable)
    .values({
      email: "owner@auraluxe.com",
      passwordHash: ownerHash,
      firstName: "Elena",
      lastName: "Vance",
      role: "salon_owner",
      isActive: true,
    })
    .onConflictDoNothing({ target: usersTable.email })
    .returning();

  const ownerId = owner?.id;
  console.log("Salon owner:", owner?.email ?? "(already exists)");

  if (!ownerId) {
    console.log("Owner already exists; skipping salon and service creation.");
    return;
  }

  const [salon] = await db
    .insert(salonsTable)
    .values({
      name: "Aura Luxe Studio",
      subdomain: "auraluxe",
      description: "A premium nail care and wellness sanctuary.",
      address: "123 Luxury Lane",
      city: "Beverly Hills",
      state: "CA",
      zipCode: "90210",
      phone: "(555) 123-4567",
      email: "hello@auraluxe.com",
      status: "active",
      timezone: "America/Los_Angeles",
      ownerId,
    })
    .returning();
  console.log("Salon:", salon.name);

  await db
    .update(usersTable)
    .set({ salonId: salon.id })
    .where(eq(usersTable.id, ownerId));

  const techHash = await bcrypt.hash("tech123", 12);
  await db
    .insert(usersTable)
    .values({
      email: "mia@auraluxe.com",
      passwordHash: techHash,
      firstName: "Mia",
      lastName: "Chen",
      role: "technician",
      salonId: salon.id,
      isActive: true,
    })
    .onConflictDoNothing({ target: usersTable.email });

  const clientHash = await bcrypt.hash("client123", 12);
  await db
    .insert(usersTable)
    .values({
      email: "sarah.j@example.com",
      passwordHash: clientHash,
      firstName: "Sarah",
      lastName: "Jenkins",
      role: "client",
      salonId: salon.id,
      isActive: true,
    })
    .onConflictDoNothing({ target: usersTable.email });

  const serviceData = [
    { name: "Classic Manicure", category: "Manicure", duration: 45, price: "45.00", description: "Shaping, cuticle care, hand massage, and your choice of regular polish." },
    { name: "Gel Manicure", category: "Manicure", duration: 60, price: "65.00", description: "Chip-free, long-lasting gel color cured under UV light." },
    { name: "Russian Manicure", category: "Manicure", duration: 90, price: "150.00", description: "Meticulous e-file cuticle work for an ultra-clean, sharp nail bed." },
    { name: "Gel-X Extensions", category: "Extensions", duration: 90, price: "125.00", description: "Premium soft-gel tips bonded with builder gel for immediate length." },
    { name: "Classic Pedicure", category: "Pedicure", duration: 60, price: "65.00", description: "Relaxing foot soak, callus removal, nail shaping, and polish." },
    { name: "Spa Pedicure", category: "Pedicure", duration: 75, price: "85.00", description: "Everything in Classic plus exfoliating sugar scrub and calf massage." },
    { name: "Nail Art Design", category: "Nail Art", duration: 60, price: "85.00", description: "Hand-painted custom designs. Price per set." },
    { name: "Chrome Powder Add-on", category: "Add-ons", duration: 15, price: "20.00", description: "Mirror-finish chrome powder for a metallic effect." },
  ];

  await db.insert(servicesTable).values(
    serviceData.map((service) => ({
      ...service,
      salonId: salon.id,
      isActive: true,
    })),
  );

  console.log(`${serviceData.length} services created`);
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
