import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed...");

  // ---------- Admin de démonstration ----------
  const adminEmail = "admin@auto-ecole.tn";
  const adminPassword = "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "Administrateur",
    },
  });
  console.log(`✅ Admin créé : ${adminEmail} / ${adminPassword}`);

  // ---------- Paramètres généraux ----------
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        schoolName: "Auto-École Réussite",
        address: "Avenue Habib Bourguiba, Tunis",
        phone: "+216 71 000 000",
        whatsapp: "+216 20 000 000",
        email: "contact@auto-ecole-reussite.tn",
        currency: "TND",
      },
    });
  }
  console.log("✅ Paramètres généraux créés");

  // ---------- Formules ----------
  const packagesData = [
    { name: "Forfait 10 séances", description: "Permis B — 10 séances de conduite", price: 700, sessionsCount: 10 },
    { name: "Forfait 20 séances", description: "Permis B — 20 séances de conduite", price: 1200, sessionsCount: 20 },
    { name: "Forfait complet", description: "Code + conduite jusqu'à l'examen", price: 1600, sessionsCount: 30 },
    { name: "Séance supplémentaire", description: "Séance de conduite à l'unité", price: 45, sessionsCount: 1 },
  ];

  const packages = [];
  for (const p of packagesData) {
    const existing = await prisma.package.findFirst({ where: { name: p.name } });
    const pkg = existing ?? (await prisma.package.create({ data: p }));
    packages.push(pkg);
  }
  console.log(`✅ ${packages.length} formules créées`);

  // ---------- Véhicules ----------
  const vehiclesData = [
    { brand: "Peugeot", model: "208", plateNumber: "123 TUN 4567", licenseType: "B" as const },
    { brand: "Renault", model: "Clio", plateNumber: "987 TUN 6543", licenseType: "B" as const },
    { brand: "Kia", model: "Picanto", plateNumber: "456 TUN 8901", licenseType: "B" as const },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const existing = await prisma.vehicle.findUnique({ where: { plateNumber: v.plateNumber } });
    const vehicle = existing ?? (await prisma.vehicle.create({ data: v }));
    vehicles.push(vehicle);
  }
  console.log(`✅ ${vehicles.length} véhicules créés`);

  // ---------- Moniteurs ----------
  const instructorsData = [
    { firstName: "Karim", lastName: "Trabelsi", phone: "+216 22 111 222" },
    { firstName: "Sami", lastName: "Bouazizi", phone: "+216 23 333 444" },
  ];

  const instructors = [];
  for (const i of instructorsData) {
    const existing = await prisma.instructor.findFirst({
      where: { firstName: i.firstName, lastName: i.lastName },
    });
    const instructor = existing ?? (await prisma.instructor.create({ data: i }));
    instructors.push(instructor);
  }
  console.log(`✅ ${instructors.length} moniteurs créés`);

  // ---------- Clients de démonstration ----------
  const clientsData = [
    {
      firstName: "Mohamed",
      lastName: "Ben Ali",
      phone: "+216 20 111 111",
      whatsapp: "+216 20 111 111",
      cin: "01234567",
      licenseType: "B" as const,
      packageId: packages[1].id,
      totalSessions: 20,
      doneSessions: 12,
      totalPrice: 1200,
      paidAmount: 800,
      notes: "Client sérieux, disponible le matin uniquement.",
    },
    {
      firstName: "Amira",
      lastName: "Gharbi",
      phone: "+216 21 222 222",
      whatsapp: "+216 21 222 222",
      cin: "02345678",
      licenseType: "B" as const,
      packageId: packages[0].id,
      totalSessions: 10,
      doneSessions: 4,
      totalPrice: 700,
      paidAmount: 700,
      notes: "A déjà passé le code.",
    },
    {
      firstName: "Youssef",
      lastName: "Jendoubi",
      phone: "+216 22 333 333",
      whatsapp: "+216 22 333 333",
      cin: "03456789",
      licenseType: "A" as const,
      packageId: null,
      totalSessions: 8,
      doneSessions: 8,
      totalPrice: 400,
      paidAmount: 200,
      notes: null,
    },
    {
      firstName: "Salma",
      lastName: "Chaabane",
      phone: "+216 23 444 444",
      whatsapp: "+216 23 444 444",
      cin: "04567890",
      licenseType: "B" as const,
      packageId: packages[2].id,
      totalSessions: 30,
      doneSessions: 2,
      totalPrice: 1600,
      paidAmount: 400,
      notes: "Préfère les séances le week-end.",
    },
    {
      firstName: "Nizar",
      lastName: "Hammami",
      phone: "+216 24 555 555",
      whatsapp: "+216 24 555 555",
      cin: "05678901",
      licenseType: "B" as const,
      packageId: packages[1].id,
      totalSessions: 20,
      doneSessions: 20,
      totalPrice: 1200,
      paidAmount: 1200,
      notes: "Formation terminée, examen réussi.",
      isActive: false,
    },
  ];

  const clients = [];
  for (const c of clientsData) {
    const existing = await prisma.client.findUnique({ where: { cin: c.cin } });
    const client =
      existing ??
      (await prisma.client.create({
        data: {
          ...c,
          startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        },
      }));
    clients.push(client);
  }
  console.log(`✅ ${clients.length} clients créés`);

  // ---------- Séances de démonstration ----------
  const today = new Date();
  const sessionsData = [
    { clientIndex: 0, dayOffset: -3, startTime: "09:00", endTime: "10:00", status: "EFFECTUEE" as const },
    { clientIndex: 0, dayOffset: 1, startTime: "15:00", endTime: "16:00", status: "PREVUE" as const },
    { clientIndex: 1, dayOffset: -2, startTime: "10:00", endTime: "11:00", status: "EFFECTUEE" as const },
    { clientIndex: 1, dayOffset: 2, startTime: "11:00", endTime: "12:00", status: "PREVUE" as const },
    { clientIndex: 2, dayOffset: -1, startTime: "14:00", endTime: "15:00", status: "EFFECTUEE" as const },
    { clientIndex: 2, dayOffset: 0, startTime: "16:00", endTime: "17:00", status: "PREVUE" as const },
    { clientIndex: 3, dayOffset: -5, startTime: "09:30", endTime: "10:30", status: "ANNULEE" as const },
    { clientIndex: 3, dayOffset: 3, startTime: "10:00", endTime: "11:00", status: "PREVUE" as const },
    { clientIndex: 3, dayOffset: 0, startTime: "08:00", endTime: "09:00", status: "ABSENCE" as const },
    { clientIndex: 4, dayOffset: -10, startTime: "13:00", endTime: "14:00", status: "EFFECTUEE" as const },
  ];

  for (const s of sessionsData) {
    const date = new Date(today);
    date.setDate(date.getDate() + s.dayOffset);
    date.setHours(0, 0, 0, 0);

    await prisma.session.create({
      data: {
        clientId: clients[s.clientIndex].id,
        date,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        type: "CONDUITE",
        instructorId: instructors[s.clientIndex % instructors.length].id,
        vehicleId: vehicles[s.clientIndex % vehicles.length].id,
      },
    });
  }
  console.log(`✅ ${sessionsData.length} séances créées`);

  // ---------- Paiements de démonstration ----------
  const paymentsData = [
    { clientIndex: 0, amount: 400, method: "ESPECES" as const, dayOffset: -30 },
    { clientIndex: 0, amount: 400, method: "VIREMENT" as const, dayOffset: -15 },
    { clientIndex: 1, amount: 700, method: "CARTE" as const, dayOffset: -20 },
    { clientIndex: 2, amount: 200, method: "ESPECES" as const, dayOffset: -25 },
    { clientIndex: 3, amount: 400, method: "CHEQUE" as const, dayOffset: -18 },
    { clientIndex: 4, amount: 1200, method: "VIREMENT" as const, dayOffset: -40 },
  ];

  for (const p of paymentsData) {
    const date = new Date(today);
    date.setDate(date.getDate() + p.dayOffset);

    await prisma.payment.create({
      data: {
        clientId: clients[p.clientIndex].id,
        amount: p.amount,
        method: p.method,
        date,
      },
    });
  }
  console.log(`✅ ${paymentsData.length} paiements créés`);

  console.log("\n🎉 Seed terminé avec succès !");
  console.log(`\n👉 Connexion admin : ${adminEmail} / ${adminPassword}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
