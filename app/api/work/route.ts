import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().optional(),
  customerName: z.string().trim().min(1),
  vehiclePlate: z.string().trim().optional(),
  assignedMechanicId: z.coerce.number().int().optional().or(z.literal("")),
  dueDate: z.string().optional()
});

export async function POST(request: Request) {
  await requireUser();
  const input = schema.parse(await request.json());
  const customer = await prisma.customer.findFirst({ where: { fullName: input.customerName }, select: { id: true } });
  if (!customer) return NextResponse.json({ error: "Choose an existing customer." }, { status: 400 });
  const assignedMechanicId = input.assignedMechanicId === "" ? null : input.assignedMechanicId ?? null;
  const dueDate = input.dueDate ? new Date(input.dueDate) : null;
  await prisma.$executeRaw`
    INSERT INTO work_items (title, description, customer_name, vehicle_plate, assigned_mechanic_id, due_date)
    VALUES (${input.title}, ${input.description || null}, ${input.customerName || null}, ${input.vehiclePlate || null}, ${assignedMechanicId}, ${dueDate})
  `;
  return NextResponse.json({ ok: true }, { status: 201 });
}
