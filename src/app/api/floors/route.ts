import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const floors = await prisma.floor.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(floors);
}
