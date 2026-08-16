import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json([]);

  const beds = await prisma.bed.findMany({
    where: {
      roomId,
      isActive: true,
      residences: { none: { isActive: true } },
    },
    orderBy: { number: "asc" },
  });
  return NextResponse.json(beds);
}
