"use server";

import { settingsRepo, roomTypeRepo, tariffRepo } from "@/repositories/settings";
import { auditRepo } from "@/repositories/audit";

// =========================================================
// Settings Actions
// =========================================================
export async function updateSettings(data: { dormName?: string; logo?: string }) {
  const settings = await settingsRepo.update(data);
  await auditRepo.log({
    action: "SETTINGS",
    entity: "Settings",
    details: JSON.stringify(data),
  });
  return settings;
}

// =========================================================
// Tariff Actions
// =========================================================
export async function updateTariff(data: {
  id?: string;
  roomTypeId: string;
  stayType: string;
  price: number;
}) {
  const tariff = await tariffRepo.upsert(data);
  await auditRepo.log({
    action: "UPDATE",
    entity: "Tariff",
    entityId: tariff.id,
    details: JSON.stringify(data),
  });
  return tariff;
}
