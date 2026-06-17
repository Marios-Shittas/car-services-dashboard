import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({
  customerId: z.coerce.number().int(),
  licensePlate: z.string().min(2),
  vinNumber: z.string().optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().optional().or(z.literal("")),
  engineType: z.string().optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"]),
  mileage: z.coerce.number().int().optional().or(z.literal("")),
  color: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  await requireUser();
  const input = schema.parse(await request.json());
  const vehicle = await prisma.vehicle.create({
    data: {
      customerId: input.customerId,
      licensePlate: input.licensePlate.toUpperCase(),
      vinNumber: input.vinNumber || null,
      make: input.make,
      model: input.model,
      year: input.year === "" ? null : input.year,
      engineType: input.engineType || null,
      fuelType: input.fuelType,
      mileage: input.mileage === "" || input.mileage === undefined ? 0 : input.mileage,
      color: input.color || null,
      notes: input.notes || null
    }
  });
  return NextResponse.json(vehicle, { status: 201 });
}
