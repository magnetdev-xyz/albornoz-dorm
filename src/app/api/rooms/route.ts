import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: { roomType: true, floor: true },
    orderBy: [{ floor: { order: "asc" } }, { number: "asc" }],
  });
  return NextResponse.json(rooms);
}
