import { prisma } from "@/lib/prisma";

export const paymentRepo = {
  getByResident: (residentId: string) =>
    prisma.payment.findMany({
      where: { residentId },
      orderBy: { paymentDate: "desc" },
    }),

  getRecent: (limit: number = 10) =>
    prisma.payment.findMany({
      include: {
        resident: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),

  create: (data: {
    residentId: string;
    amount: number;
    method: string;
    trackingNumber?: string;
    description?: string;
    receiptPhotos?: string;
    paymentDate: string;
  }) =>
    prisma.payment.create({
      data: {
        ...data,
        trackingNumber: data.trackingNumber ?? "",
        description: data.description ?? "",
        receiptPhotos: data.receiptPhotos ?? "[]",
      },
    }),

  getAll: () =>
    prisma.payment.findMany({
      include: {
        resident: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { paymentDate: "desc" },
    }),

  getByDateRange: (startDate: string, endDate: string) =>
    prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
      },
      include: {
        resident: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { paymentDate: "desc" },
    }),
};
