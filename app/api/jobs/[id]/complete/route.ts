import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const job = await prisma.repairJob.update({ where: { id: Number(id) }, data: { status: "COMPLETED", dateCompleted: new Date() } });
  return NextResponse.json(job);
}
