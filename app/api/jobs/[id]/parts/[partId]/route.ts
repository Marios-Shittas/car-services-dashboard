import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const schema = z.object({
  partName: z.string().min(2),
  partNumber: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  supplier: z.string().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; partId: string }> }) {
  await requireUser();
  const { id, partId } = await params;
  const input = schema.parse(await request.json());
  const part = await prisma.partUsed.updateMany({
    where: { id: Number(partId), jobId: Number(id) },
    data: {
      ...input,
      partNumber: input.partNumber || null,
      supplier: input.supplier || null
    }
  });
  return NextResponse.json(part);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; partId: string }> }) {
  await requireUser();
  const { id, partId } = await params;
  await prisma.partUsed.deleteMany({ where: { id: Number(partId), jobId: Number(id) } });
  return NextResponse.json({ ok: true });
}
