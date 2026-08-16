import { prisma } from "@/lib/prisma";

export const residenceRepo = {
  getActiveByResident: (residentId: string) =>
    prisma.residence.findFirst({
      where: { residentId, isActive: true },
      include: {
        bed: { include: { room: { include: { roomType: true, floor: true } } } },
        extensions: true,
      },
    }),

  getById: (id: string) =>
    prisma.residence.findUnique({
      where: { id },
      include: {
        bed: { include: { room: { include: { roomType: true, floor: true } } } },
        resident: true,
        extensions: true,
      },
    }),

  create: (data: {
    residentId: string;
    bedId: string;
    stayType: string;
    startDate: string;
    endDate: string;
    contractAmount: number;
    description?: string;
  }) => prisma.residence.create({ data: { ...data, description: data.description ?? "" } }),

  checkout: (id: string, checkoutDate: string) =>
    prisma.residence.update({
      where: { id },
      data: { isActive: false, isCheckedOut: true, checkoutDate },
    }),

  extend: (residenceId: string, days: number, newEndDate: string) =>
    prisma.residence.update({
      where: { id: residenceId },
      data: { endDate: newEndDate },
    }),

  addExtension: (data: {
    residenceId: string;
    days: number;
    newEndDate: string;
    description?: string;
  }) =>
    prisma.extension.create({
      data: {
        residenceId: data.residenceId,
        days: data.days,
        newEndDate: data.newEndDate,
        description: data.description ?? "",
      },
    }),

  changeBed: (residenceId: string, newBedId: string) =>
    prisma.residence.update({
      where: { id: residenceId },
      data: { bedId: newBedId },
    }),

  getExpiringSoon: (today: string, withinDays: number) =>
    prisma.residence.findMany({
      where: {
        isActive: true,
        endDate: { gte: today },
      },
      include: {
        resident: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        bed: {
          include: { room: { include: { roomType: true } } },
        },
      },
    }),
};
