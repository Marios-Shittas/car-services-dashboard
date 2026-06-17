import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const itemSchema = z.object({
  itemKey: z.string().min(1),
  label: z.string().min(1),
  category: z.string().min(1),
  completed: z.boolean(),
  notes: z.string().optional().nullable()
});

const schema = z.object({
  vehicleReceivedAt: z.string().optional().or(z.literal("")),
  jobCardIssuedAt: z.string().optional().or(z.literal("")),
  serviceMileage: z.coerce.number().int().optional().or(z.literal("")),
  items: z.array(itemSchema)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const jobId = Number(id);
  const input = schema.parse(await request.json());
  const serviceMileage = input.serviceMileage === "" || input.serviceMileage === undefined ? null : input.serviceMileage;
  const oilChangeDueMileage = serviceMileage === null ? null : serviceMileage + 5000;
  const nextServiceDueMileage = serviceMileage === null ? null : serviceMileage + 10000;

  await prisma.$transaction(async (tx) => {
    const job = await tx.repairJob.update({
      where: { id: jobId },
      data: {
        vehicleReceivedAt: input.vehicleReceivedAt ? new Date(input.vehicleReceivedAt) : null,
        jobCardIssuedAt: input.jobCardIssuedAt ? new Date(input.jobCardIssuedAt) : null,
        serviceMileage,
        oilChangeDueMileage,
        nextServiceDueMileage
      },
      select: { vehicleId: true }
    });

    if (serviceMileage !== null) {
      await tx.vehicle.updateMany({
        where: { id: job.vehicleId, mileage: { lt: serviceMileage } },
        data: { mileage: serviceMileage }
      });
    }

    await tx.jobServiceItem.deleteMany({ where: { jobId } });
    if (input.items.length) {
      await tx.jobServiceItem.createMany({
        data: input.items.map((item) => ({
          jobId,
          itemKey: item.itemKey,
          label: item.label,
          category: item.category,
          completed: item.completed,
          notes: item.notes || null
        }))
      });
    }
  });

  return NextResponse.json({ ok: true });
}
