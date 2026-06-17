import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({ partName: z.string().min(2), partNumber: z.string().optional(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().min(0), supplier: z.string().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const input = schema.parse(Object.fromEntries(await request.formData()));
  const part = await prisma.partUsed.create({ data: { jobId: Number(id), ...input, partNumber: input.partNumber || null, supplier: input.supplier || null } });
  return NextResponse.json(part, { status: 201 });
}
