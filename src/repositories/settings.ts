import { prisma } from "@/lib/prisma";

// =========================================================
// Settings Repository
// =========================================================
export const settingsRepo = {
  get: () => prisma.settings.findFirst({ where: { id: 1 } }),
  update: (data: { dormName?: string; logo?: string }) =>
    prisma.settings.update({ where: { id: 1 }, data }),
};

// =========================================================
// Floor Repository
// =========================================================
export const floorRepo = {
  getAll: () => prisma.floor.findMany({ orderBy: { order: "asc" } }),
  getById: (id: string) => prisma.floor.findUnique({ where: { id } }),
  create: (data: { name: string; order?: number }) =>
    prisma.floor.create({ data: { name: data.name, order: data.order ?? 0 } }),
  update: (id: string, data: { name?: string; order?: number }) =>
    prisma.floor.update({ where: { id }, data }),
  delete: (id: string) => prisma.floor.delete({ where: { id } }),
};

// =========================================================
// RoomType Repository
// =========================================================
export const roomTypeRepo = {
  getAll: () => prisma.roomType.findMany({ include: { tariffs: true } }),
  getActive: () =>
    prisma.roomType.findMany({
      where: { isActive: true },
      include: { tariffs: { where: { isActive: true } } },
    }),
  getById: (id: string) =>
    prisma.roomType.findUnique({ where: { id }, include: { tariffs: true } }),
  create: (data: { name: string; capacity: number }) =>
    prisma.roomType.create({ data }),
  update: (id: string, data: { name?: string; capacity?: number; isActive?: boolean }) =>
    prisma.roomType.update({ where: { id }, data }),
};

// =========================================================
// Tariff Repository
// =========================================================
export const tariffRepo = {
  getByRoomType: (roomTypeId: string) =>
    prisma.tariff.findMany({ where: { roomTypeId, isActive: true } }),
  getByRoomTypeAndStayType: (roomTypeId: string, stayType: string) =>
    prisma.tariff.findFirst({
      where: { roomTypeId, stayType, isActive: true },
    }),
  upsert: (data: {
    id?: string;
    roomTypeId: string;
    stayType: string;
    price: number;
  }) =>
    prisma.tariff.upsert({
      where: { id: data.id ?? "new" },
      update: { price: data.price },
      create: {
        roomTypeId: data.roomTypeId,
        stayType: data.stayType,
        price: data.price,
      },
    }),
  toggleActive: (id: string, isActive: boolean) =>
    prisma.tariff.update({ where: { id }, data: { isActive } }),
};
