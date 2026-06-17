import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({
  description: z.string().min(2),
  hoursWorked: z.coerce.number().positive(),
  hourlyRate: z.coerce.number().positive(),
  mechanicId: z.coerce.number().int()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  await requireUser();
  const { id, entryId } = await params;
  const input = schema.parse(await request.json());
  const entry = await prisma.laborEntry.updateMany({
    where: { id: Number(entryId), jobId: Number(id) },
    data: input
  });
  return NextResponse.json(entry);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  await requireUser();
  const { id, entryId } = await params;
  await prisma.laborEntry.deleteMany({ where: { id: Number(entryId), jobId: Number(id) } });
  return NextResponse.json({ ok: true });
}
