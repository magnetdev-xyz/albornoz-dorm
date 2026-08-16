import { prisma } from "@/lib/prisma";

const residentInclude = {
  documents: true,
  residences: {
    include: {
      bed: {
        include: { room: { include: { roomType: true, floor: true } } },
      },
      extensions: { orderBy: { createdAt: "desc" as const } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  payments: { orderBy: { paymentDate: "desc" as const } },
};

export const residentRepo = {
  getAll: () =>
    prisma.resident.findMany({
      where: { isActive: true },
      include: {
        documents: true,
        residences: {
          where: { isActive: true },
          include: {
            bed: {
              include: { room: { include: { roomType: true, floor: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

  getById: (id: string) =>
    prisma.resident.findUnique({
      where: { id },
      include: residentInclude,
    }),

  getByNationalCode: (nationalCode: string) =>
    prisma.resident.findUnique({ where: { nationalCode } }),

  create: (data: {
    firstName: string;
    lastName: string;
    fatherName: string;
    nationalCode: string;
    phone: string;
    photo?: string;
  }) =>
    prisma.resident.create({
      data: {
        ...data,
        photo: data.photo ?? "",
      },
    }),

  update: (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      fatherName?: string;
      nationalCode?: string;
      phone?: string;
      photo?: string;
    }
  ) => prisma.resident.update({ where: { id }, data }),

  deactivate: (id: string) =>
    prisma.resident.update({ where: { id }, data: { isActive: false } }),

  getDebtors: async () => {
    const residents = await prisma.resident.findMany({
      where: { isActive: true },
      include: {
        residences: { where: { isActive: true } },
        payments: true,
      },
    });

    return residents
      .map((r) => {
        const totalContracts = r.residences.reduce(
          (sum, res) => sum + res.contractAmount,
          0
        );
        const totalPayments = r.payments.reduce(
          (sum, p) => sum + p.amount,
          0
        );
        const debt = totalContracts - totalPayments;
        return {
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          phone: r.phone,
          totalContracts,
          totalPayments,
          debt,
        };
      })
      .filter((r) => r.debt > 0)
      .sort((a, b) => b.debt - a.debt);
  },
};
