import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const vehicleSchema = z.object({
  licensePlate: z.string().optional(),
  vinNumber: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional().or(z.literal("")),
  mileage: z.coerce.number().int().optional().or(z.literal("")),
  engineType: z.string().optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"]).optional(),
  color: z.string().optional(),
  notes: z.string().optional()
});

const schema = z.object({
  fullName: z.string().min(2, "Add the customer's full name."),
  phone: z.string().refine((value) => value.replace(/\D/g, "").length >= 8, "Phone number needs at least 8 digits."),
  email: z.string().email("Email must include @.").optional().or(z.literal("")),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional(),
  vehicles: z.array(vehicleSchema).optional(),
  vehicleLicensePlate: z.string().optional(),
  vehicleVinNumber: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number().int().optional().or(z.literal("")),
  vehicleMileage: z.coerce.number().int().optional().or(z.literal("")),
  vehicleEngineType: z.string().optional(),
  vehicleFuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"]).optional(),
  vehicleColor: z.string().optional(),
  vehicleNotes: z.string().optional()
}).superRefine((input, ctx) => {
  const legacyVehicle = {
    licensePlate: input.vehicleLicensePlate,
    vinNumber: input.vehicleVinNumber,
    make: input.vehicleMake,
    model: input.vehicleModel,
    year: input.vehicleYear,
    mileage: input.vehicleMileage,
    engineType: input.vehicleEngineType,
    fuelType: input.vehicleFuelType,
    color: input.vehicleColor,
    notes: input.vehicleNotes
  };
  const vehicles = [...(input.vehicles ?? []), legacyVehicle].filter((vehicle) => Object.values(vehicle).some(Boolean));

  vehicles.forEach((vehicle, index) => {
    if (!vehicle.licensePlate) {
      ctx.addIssue({ code: "custom", path: ["vehicles", index, "licensePlate"], message: `Car ${index + 1}: add the license plate.` });
    }
    if (!vehicle.make) {
      ctx.addIssue({ code: "custom", path: ["vehicles", index, "make"], message: `Car ${index + 1}: add the brand.` });
    }
    if (!vehicle.model) {
      ctx.addIssue({ code: "custom", path: ["vehicles", index, "model"], message: `Car ${index + 1}: add the model.` });
    }
  });
});

export async function GET() {
  await requireUser();
  const customers = await prisma.customer.findMany({ orderBy: { fullName: "asc" } });
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  await requireUser();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the customer and vehicle details." }, { status: 400 });
  }
  const input = parsed.data;
  const legacyVehicle = {
    licensePlate: input.vehicleLicensePlate,
    vinNumber: input.vehicleVinNumber,
    make: input.vehicleMake,
    model: input.vehicleModel,
    year: input.vehicleYear,
    mileage: input.vehicleMileage,
    engineType: input.vehicleEngineType,
    fuelType: input.vehicleFuelType,
    color: input.vehicleColor,
    notes: input.vehicleNotes
  };
  const vehicles = [...(input.vehicles ?? []), legacyVehicle].filter((vehicle) => Object.values(vehicle).some(Boolean));
  try {
    const customer = await prisma.$transaction(async (tx) => {
      const createdCustomer = await tx.customer.create({
        data: {
          fullName: input.fullName,
          phone: input.phone,
          email: input.email || null,
          address: input.address || null,
          vatNumber: input.vatNumber || null,
          notes: input.notes || null
        }
      });

      if (vehicles.length) {
        await tx.vehicle.createMany({
          data: vehicles.map((vehicle) => ({
            customerId: createdCustomer.id,
            licensePlate: vehicle.licensePlate!.toUpperCase(),
            vinNumber: vehicle.vinNumber || null,
            make: vehicle.make!,
            model: vehicle.model!,
            year: vehicle.year === "" ? null : vehicle.year,
            engineType: vehicle.engineType || null,
            fuelType: vehicle.fuelType ?? "PETROL",
            mileage: vehicle.mileage === "" || vehicle.mileage === undefined ? 0 : vehicle.mileage,
            color: vehicle.color || null,
            notes: vehicle.notes || null
          }))
        });
      }

      return createdCustomer;
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A vehicle with this plate or VIN already exists." }, { status: 409 });
    }
    throw error;
  }
}
