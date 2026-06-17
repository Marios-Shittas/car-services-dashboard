import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({ description: z.string().min(2), hoursWorked: z.coerce.number().positive(), hourlyRate: z.coerce.number().positive(), mechanicId: z.coerce.number().int() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const form = Object.fromEntries(await request.formData());
  const input = schema.parse(form);
  const entry = await prisma.laborEntry.create({ data: { jobId: Number(id), ...input } });
  return NextResponse.json(entry, { status: 201 });
}
