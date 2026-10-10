import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const RATE_CONDUITE = 28;
const RATE_CODE = 10;

function daysFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function seedDemoData(vehicleIds: string[], instructorIds: string[]) {
  const clientsData = [
    {
      firstName: "Mohamed",
      lastName: "Ben Ali",
      phone: "+216 20 111 111",
      whatsapp: "+216 20 111 111",
      cin: "01234567",
      notes: "Client sérieux, disponible le matin uniquement.",
      registrations: { code: true, park: true, conduite: true },
    },
    {
      firstName: "Amira",
      lastName: "Gharbi",
      phone: "+216 21 222 222",
      whatsapp: "+216 21 222 222",
      cin: "02345678",
      notes: "A échoué une fois au code, réussi au 2e passage.",
      registrations: { code: true, park: true, conduite: true },
    },
    {
      firstName: "Youssef",
      lastName: "Jendoubi",
      phone: "+216 22 333 333",
      whatsapp: "+216 22 333 333",
      cin: "03456789",
      notes: null,
      registrations: { code: true, park: false, conduite: false },
    },
    {
      firstName: "Salma",
      lastName: "Chaabane",
      phone: "+216 23 444 444",
      whatsapp: "+216 23 444 444",
      cin: "04567890",
      notes: "Préfère les séances le week-end.",
      registrations: { code: false, park: true, conduite: true },
    },
  ];

  const clients = [];
  for (const { registrations: r, ...c } of clientsData) {
    clients.push(
      await prisma.client.create({
        data: {
          ...c,
          licenseType: "B",
          startDate: daysFromToday(-45),
          registeredCode: r.code,
          registeredPark: r.park,
          registeredConduite: r.conduite,
          feeInscriptionCode: r.code ? 100 : 0,
          feeInscriptionPark: r.park ? 200 : 0,
          feeInscriptionConduite: r.conduite ? 200 : 0,
        },
      })
    );
  }

  // Séances : [client, jour, début, fin, type, statut]
  const sessionsData: [number, number, string, string, "CONDUITE" | "PARK" | "CODE", "PREVUE" | "EFFECTUEE" | "ANNULEE" | "ABSENCE"][] = [
    [0, -20, "09:00", "10:00", "CODE", "EFFECTUEE"],
    [0, -18, "09:00", "11:00", "CODE", "EFFECTUEE"],
    [0, -10, "09:00", "10:00", "PARK", "EFFECTUEE"],
    [0, -3, "09:00", "10:30", "CONDUITE", "EFFECTUEE"],
    [0, 1, "15:00", "16:00", "CONDUITE", "PREVUE"],
    [1, -15, "10:00", "11:00", "PARK", "EFFECTUEE"],
    [1, -8, "10:00", "11:00", "CONDUITE", "EFFECTUEE"],
    [1, -2, "10:00", "11:00", "CONDUITE", "EFFECTUEE"],
    [1, 2, "11:00", "12:00", "CONDUITE", "PREVUE"],
    [2, -6, "14:00", "16:00", "CODE", "EFFECTUEE"],
    [2, 0, "16:00", "17:00", "CODE", "PREVUE"],
    [3, -5, "09:30", "10:30", "PARK", "ANNULEE"],
    [3, -1, "08:00", "09:00", "PARK", "ABSENCE"],
    [3, 3, "10:00", "11:00", "PARK", "PREVUE"],
  ];

  for (const [ci, day, startTime, endTime, type, status] of sessionsData) {
    await prisma.session.create({
      data: {
        clientId: clients[ci].id,
        date: daysFromToday(day),
        startTime,
        endTime,
        type,
        status,
        hourlyRate: type === "CODE" ? RATE_CODE : RATE_CONDUITE,
        instructorId: instructorIds[ci % instructorIds.length],
        vehicleId: type === "CODE" ? null : vehicleIds[ci % vehicleIds.length],
      },
    });
  }

  // Examens (avec échecs et nouveaux passages)
  const examsData: [number, number, "CODE" | "PARK" | "CONDUITE", "PROGRAMME" | "REUSSI" | "ECHOUE" | "ABSENT", number][] = [
    [0, -14, "CODE", "REUSSI", 0],
    [0, 6, "PARK", "PROGRAMME", 0],
    [1, -30, "CODE", "ECHOUE", 0],
    [1, -21, "CODE", "REUSSI", 30],
    [1, -9, "PARK", "REUSSI", 0],
    [1, 10, "CONDUITE", "PROGRAMME", 0],
    [2, 4, "CODE", "PROGRAMME", 0],
  ];
  for (const [ci, day, type, result, fee] of examsData) {
    await prisma.exam.create({
      data: {
        clientId: clients[ci].id,
        date: daysFromToday(day),
        time: "08:30",
        type,
        result,
        fee,
        location: "Centre d'examen ATTT",
      },
    });
  }

  // Paiements par compte : [client, jour, montant, compte, mode]
  const paymentsData: [number, number, number, "INSCRIPTION" | "CONDUITE" | "CODE" | "EXAMEN", "ESPECES" | "VIREMENT" | "CHEQUE" | "CARTE"][] = [
    [0, -40, 300, "INSCRIPTION", "ESPECES"],
    [0, -19, 30, "CODE", "ESPECES"],
    [0, -3, 70, "CONDUITE", "ESPECES"],
    [1, -40, 500, "INSCRIPTION", "VIREMENT"],
    [1, -21, 30, "EXAMEN", "ESPECES"],
    [1, -8, 140, "CONDUITE", "CARTE"],
    [2, -10, 100, "INSCRIPTION", "ESPECES"],
    [3, -12, 200, "INSCRIPTION", "CHEQUE"],
  ];
  for (const [ci, day, amount, category, method] of paymentsData) {
    await prisma.payment.create({
      data: { clientId: clients[ci].id, date: daysFromToday(day), amount, category, method },
    });
  }

  // Dépenses
  const expensesData: [number, string, "CARBURANT" | "ENTRETIEN" | "SALAIRE" | "LOYER" | "FACTURES" | "ASSURANCE", number][] = [
    [-2, "Plein carburant Peugeot 208", "CARBURANT", 90],
    [-9, "Plein carburant Renault Clio", "CARBURANT", 85],
    [-12, "Vidange + filtres Clio", "ENTRETIEN", 160],
    [-25, "Salaire moniteur", "SALAIRE", 1100],
    [-28, "Loyer du local", "LOYER", 650],
    [-15, "Facture STEG", "FACTURES", 120],
    [-35, "Assurance flotte (trimestre)", "ASSURANCE", 900],
  ];
  for (const [day, label, category, amount] of expensesData) {
    await prisma.expense.create({ data: { date: daysFromToday(day), label, category, amount } });
  }

  console.log(
    `✅ Démo : ${clients.length} clients, ${sessionsData.length} séances, ${examsData.length} examens, ${paymentsData.length} paiements, ${expensesData.length} dépenses`
  );
}

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
        priceHourConduite: 28,
        priceHourCode: 10,
        feeInscriptionCode: 100,
        feeInscriptionConduite: 200,
        feeInscriptionPark: 200,
      },
    });
  }
  console.log("✅ Paramètres généraux créés");

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

  // ---------- Données de démonstration (uniquement sur une base vide) ----------
  if ((await prisma.client.count()) > 0) {
    console.log("ℹ️  Des clients existent déjà : données de démonstration ignorées");
  } else {
    await seedDemoData(
      vehicles.map((v) => v.id),
      instructors.map((i) => i.id)
    );
  }

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
