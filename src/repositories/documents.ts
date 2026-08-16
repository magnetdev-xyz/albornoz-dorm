import { prisma } from "@/lib/prisma";

export const documentRepo = {
  getByResident: (residentId: string) =>
    prisma.document.findFirst({ where: { residentId } }),

  upsert: (
    residentId: string,
    data: {
      nationalCard?: boolean;
      birthCert?: boolean;
      driverLicense?: boolean;
      militaryCard?: boolean;
    }
  ) =>
    prisma.document.upsert({
      where: { residentId },
      update: data,
      create: { residentId, ...data },
    }),
};
