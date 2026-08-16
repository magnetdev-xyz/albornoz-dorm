import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const types = await prisma.roomType.findMany({
    where: { isActive: true },
    include: { tariffs: { where: { isActive: true } } },
  });
  return NextResponse.json(types);
}
