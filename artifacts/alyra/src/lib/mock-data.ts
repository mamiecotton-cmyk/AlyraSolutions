import { 
  Appointment, 
  AppointmentStatus, 
  NailColor, 
  NailColorFinish, 
  Salon, 
  SalonStatus, 
  WaitlistEntry, 
  WaitlistEntryStatus,
  User,
  UserRole
} from "@workspace/api-client-react";

// Fallback data when API is missing
export const MOCK_SALON: Salon = {
  id: 1,
  name: "Aura Luxe Studio",
  subdomain: "auraluxe",
  description: "A premium nail care and wellness sanctuary.",
  address: "123 Luxury Lane",
  city: "Beverly Hills",
  state: "CA",
  zipCode: "90210",
  phone: "(555) 123-4567",
  status: SalonStatus.active,
  timezone: "America/Los_Angeles",
  ownerId: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_USER: User = {
  id: 2,
  email: "owner@auraluxe.com",
  firstName: "Elena",
  lastName: "Vance",
  role: UserRole.salon_owner,
  salonId: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_CLIENT_USER: User = {
  id: 5,
  email: "sarah.j@example.com",
  firstName: "Sarah",
  lastName: "Jenkins",
  role: UserRole.client,
  salonId: 1,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 101,
    salonId: 1,
    clientId: 5,
    clientName: "Isabella Rossi",
    clientPhone: "(555) 987-6543",
    scheduledAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    estimatedEndAt: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    status: AppointmentStatus.in_progress,
    totalAmount: 125,
    technicians: [{ technicianId: 3, firstName: "Mia", lastName: "Chen", role: "primary" }],
    services: [{ serviceId: 1, name: "Gel-X Extensions", duration: 90, price: 125 }],
    nailColorId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 102,
    salonId: 1,
    clientId: 6,
    clientName: "Sophia Patel",
    scheduledAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    estimatedEndAt: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    status: AppointmentStatus.confirmed,
    totalAmount: 65,
    technicians: [{ technicianId: 4, firstName: "Chloe", lastName: "Kim", role: "primary" }],
    services: [{ serviceId: 2, name: "Classic Pedicure", duration: 60, price: 65 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 103,
    salonId: 1,
    clientId: 7,
    clientName: "Emma Thompson",
    scheduledAt: new Date(new Date().setHours(16, 30, 0, 0)).toISOString(),
    estimatedEndAt: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    status: AppointmentStatus.pending,
    totalAmount: 150,
    technicians: [{ technicianId: 3, firstName: "Mia", lastName: "Chen", role: "primary" }],
    services: [{ serviceId: 3, name: "Russian Manicure", duration: 90, price: 150 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const MOCK_WAITLIST: WaitlistEntry[] = [
  {
    id: 1,
    salonId: 1,
    clientName: "Olivia Davis",
    partySize: 1,
    serviceIds: [1],
    status: WaitlistEntryStatus.waiting,
    position: 1,
    estimatedWaitMinutes: 15,
    checkInCode: "W-1234",
    joinedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 2,
    salonId: 1,
    clientName: "Ava & Friend",
    partySize: 2,
    serviceIds: [2, 2],
    status: WaitlistEntryStatus.waiting,
    position: 2,
    estimatedWaitMinutes: 35,
    checkInCode: "W-5678",
    joinedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  }
];

export const MOCK_COLORS: NailColor[] = [
  { id: 1, salonId: 1, name: "Vampire Red", brand: "OPI", colorCode: "#5C0000", finish: NailColorFinish.glossy, inStock: true, isPopular: true, tags: ["dark", "red"], createdAt: "", updatedAt: "" },
  { id: 2, salonId: 1, name: "Ballet Slippers", brand: "Essie", colorCode: "#FADADD", finish: NailColorFinish.glossy, inStock: true, isPopular: true, tags: ["nude", "pink"], createdAt: "", updatedAt: "" },
  { id: 3, salonId: 1, name: "Onyx Black", brand: "CND", colorCode: "#0f0f11", finish: NailColorFinish.matte, inStock: true, isPopular: false, tags: ["black", "dark"], createdAt: "", updatedAt: "" },
  { id: 4, salonId: 1, name: "Champagne Gold", brand: "Gelish", colorCode: "#F3E5AB", finish: NailColorFinish.shimmer, inStock: true, isPopular: true, tags: ["gold", "glitter"], createdAt: "", updatedAt: "" },
  { id: 5, salonId: 1, name: "Matcha Green", brand: "The GelBottle", colorCode: "#A9C5A0", finish: NailColorFinish.glossy, inStock: true, isPopular: false, tags: ["green", "pastel"], createdAt: "", updatedAt: "" },
  { id: 6, salonId: 1, name: "Chrome Silver", brand: "Daily Charme", colorCode: "#E0E0E0", finish: NailColorFinish.chrome, inStock: false, isPopular: true, tags: ["metallic", "silver"], createdAt: "", updatedAt: "" },
];
