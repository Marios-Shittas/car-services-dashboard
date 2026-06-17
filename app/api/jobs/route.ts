import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({
  customerId: z.coerce.number().int(),
  vehicleId: z.coerce.number().int(),
  vehicleMileage: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().min(0).optional()),
  assignedMechanicId: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().optional()),
  problemDescription: z.string().min(3),
  estimatedCompletionAt: z.string().optional().or(z.literal("")),
  mechanicNotes: z.string().optional()
});

export async function POST(request: Request) {
  await requireUser();
  const input = schema.parse(await request.json());
  const count = await prisma.repairJob.count({ where: { dateOpened: { gte: new Date(new Date().getFullYear(), 0, 1) } } });
  const vehicleMileage = input.vehicleMileage ?? null;
  const job = await prisma.$transaction(async (tx) => {
    const createdJob = await tx.repairJob.create({
      data: {
        jobNumber: `JOB-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`,
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        assignedMechanicId: input.assignedMechanicId ?? null,
        problemDescription: input.problemDescription,
        estimatedCompletionAt: input.estimatedCompletionAt ? new Date(input.estimatedCompletionAt) : null,
        mechanicNotes: input.mechanicNotes || null
      }
    });

    if (vehicleMileage !== null) {
      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: { mileage: vehicleMileage }
      });
    }

    return createdJob;
  });
  return NextResponse.json(job, { status: 201 });
}
