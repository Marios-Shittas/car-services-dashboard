import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const input = schema.parse(await request.json());
  const customer = await prisma.customer.update({
    where: { id: Number(id) },
    data: {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || null,
      address: input.address || null,
      vatNumber: input.vatNumber || null,
      notes: input.notes || null
    }
  });
  return NextResponse.json(customer);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const customerId = Number(id);
  const [vehicles, jobs, invoices] = await Promise.all([
    prisma.vehicle.count({ where: { customerId } }),
    prisma.repairJob.count({ where: { customerId } }),
    prisma.invoice.count({ where: { customerId } })
  ]);

  if (vehicles || jobs || invoices) {
    return NextResponse.json(
      { error: "This customer has vehicles, jobs, or invoices. Keep the history, or remove those records first." },
      { status: 409 }
    );
  }

  await prisma.customer.delete({ where: { id: customerId } });
  return new Response(null, { status: 204 });
}
