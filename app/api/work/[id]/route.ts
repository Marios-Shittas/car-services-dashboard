import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const paramsSchema = z.object({ id: z.coerce.number().int() });
const updateSchema = z.object({ completed: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = paramsSchema.parse(await params);
  const input = updateSchema.parse(await request.json());
  const completedAt = input.completed ? new Date() : null;
  await prisma.$executeRaw`
    UPDATE work_items
    SET completed = ${input.completed}, completed_at = ${completedAt}
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = paramsSchema.parse(await params);
  await prisma.$executeRaw`
    DELETE FROM work_items
    WHERE id = ${id}
  `;
  return NextResponse.json({ ok: true });
}
