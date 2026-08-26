import { prisma } from "@/lib/prisma";
import { PlanningCalendar } from "@/components/planning-calendar";

export default async function PlanningPage() {
  const [sessions, clients, instructors, vehicles] = await Promise.all([
    prisma.session.findMany({
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        client: { select: { firstName: true, lastName: true } },
        instructor: true,
        vehicle: true,
      },
    }),
    prisma.client.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.instructor.findMany({ where: { isActive: true }, orderBy: { firstName: "asc" } }),
    prisma.vehicle.findMany({ where: { isActive: true }, orderBy: { brand: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planning</h1>
        <p className="text-slate-500 text-sm mt-1">
          Vue calendrier — cliquez sur un jour pour voir, ajouter ou modifier ses séances
        </p>
      </div>

      <PlanningCalendar
        sessions={sessions.map((s: (typeof sessions)[number]) => ({
          id: s.id,
          clientId: s.clientId,
          clientName: `${s.client.firstName} ${s.client.lastName}`,
          date: s.date.toISOString(),
          startTime: s.startTime,
          endTime: s.endTime,
          type: s.type,
          status: s.status,
          notes: s.notes,
          instructorId: s.instructorId,
          instructorName: s.instructor ? `${s.instructor.firstName} ${s.instructor.lastName}` : null,
          vehicleId: s.vehicleId,
          vehicleLabel: s.vehicle ? `${s.vehicle.brand} ${s.vehicle.model}` : null,
        }))}
        clients={clients}
        instructors={instructors}
        vehicles={vehicles}
      />
    </div>
  );
}
