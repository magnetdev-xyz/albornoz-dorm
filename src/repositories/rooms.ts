import { prisma } from "@/lib/prisma";

const roomInclude = {
  floor: true,
  roomType: true,
  beds: { orderBy: { number: "asc" as const } },
};

export const roomRepo = {
  getAll: () =>
    prisma.room.findMany({
      include: roomInclude,
      orderBy: [{ floor: { order: "asc" } }, { number: "asc" }],
    }),
  getById: (id: string) =>
    prisma.room.findUnique({ where: { id }, include: roomInclude }),
  getByFloor: (floorId: string) =>
    prisma.room.findMany({
      where: { floorId },
      include: roomInclude,
      orderBy: { number: "asc" },
    }),
  create: (data: {
    number: string;
    floorId: string;
    roomTypeId: string;
    description?: string;
  }) => prisma.room.create({ data }),
  update: (
    id: string,
    data: {
      number?: string;
      floorId?: string;
      roomTypeId?: string;
      description?: string;
      isActive?: boolean;
    }
  ) => prisma.room.update({ where: { id }, data }),
  delete: (id: string) => prisma.room.delete({ where: { id } }),
  getStats: async (id: string) => {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
        beds: {
          include: {
            residences: {
              where: { isActive: true },
              include: { resident: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });
    return room;
  },
};

export const bedRepo = {
  getByRoom: (roomId: string) =>
    prisma.bed.findMany({ where: { roomId }, orderBy: { number: "asc" } }),
  getAvailableByRoom: (roomId: string) =>
    prisma.bed.findMany({
      where: {
        roomId,
        isActive: true,
        residences: { none: { isActive: true } },
      },
      orderBy: { number: "asc" },
    }),
  getById: (id: string) =>
    prisma.bed.findUnique({
      where: { id },
      include: {
        room: { include: { roomType: true, floor: true } },
        residences: {
          where: { isActive: true },
          include: { resident: true },
        },
      },
    }),
  create: (data: { number: string; roomId: string }) =>
    prisma.bed.create({ data }),
  update: (id: string, data: { number?: string; isActive?: boolean }) =>
    prisma.bed.update({ where: { id }, data }),
  delete: (id: string) => prisma.bed.delete({ where: { id } }),
  isOccupied: async (bedId: string) => {
    const count = await prisma.residence.count({
      where: { bedId, isActive: true },
    });
    return count > 0;
  },
};
