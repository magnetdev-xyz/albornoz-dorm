import { prisma } from "@/lib/prisma";

export const auditRepo = {
  log: (data: {
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
  }) =>
    prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? "",
        details: data.details ?? "",
      },
    }),

  getAll: (limit: number = 100) =>
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    }),

  getByEntity: (entity: string, entityId: string) =>
    prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: "desc" },
    }),
};
