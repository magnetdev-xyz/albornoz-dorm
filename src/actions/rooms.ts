"use server";

import { roomRepo, bedRepo } from "@/repositories/rooms";
import { floorRepo } from "@/repositories/settings";
import { auditRepo } from "@/repositories/audit";

// =========================================================
// Floor Actions
// =========================================================
export async function createFloor(data: { name: string; order?: number }) {
  const floor = await floorRepo.create(data);
  await auditRepo.log({
    action: "CREATE",
    entity: "Floor",
    entityId: floor.id,
    details: JSON.stringify(data),
  });
  return floor;
}

export async function updateFloor(
  id: string,
  data: { name?: string; order?: number }
) {
  const floor = await floorRepo.update(id, data);
  await auditRepo.log({
    action: "UPDATE",
    entity: "Floor",
    entityId: id,
    details: JSON.stringify(data),
  });
  return floor;
}

export async function deleteFloor(id: string) {
  await floorRepo.delete(id);
  await auditRepo.log({
    action: "DELETE",
    entity: "Floor",
    entityId: id,
  });
}

// =========================================================
// Room Actions
// =========================================================
export async function createRoom(data: {
  number: string;
  floorId: string;
  roomTypeId: string;
  description?: string;
}) {
  const room = await roomRepo.create(data);
  await auditRepo.log({
    action: "CREATE",
    entity: "Room",
    entityId: room.id,
    details: JSON.stringify(data),
  });
  return room;
}

export async function updateRoom(
  id: string,
  data: {
    number?: string;
    floorId?: string;
    roomTypeId?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const room = await roomRepo.update(id, data);
  await auditRepo.log({
    action: "UPDATE",
    entity: "Room",
    entityId: id,
    details: JSON.stringify(data),
  });
  return room;
}

export async function deleteRoom(id: string) {
  await roomRepo.delete(id);
  await auditRepo.log({
    action: "DELETE",
    entity: "Room",
    entityId: id,
  });
}

// =========================================================
// Bed Actions
// =========================================================
export async function createBed(data: { number: string; roomId: string }) {
  const bed = await bedRepo.create(data);
  await auditRepo.log({
    action: "CREATE",
    entity: "Bed",
    entityId: bed.id,
    details: JSON.stringify(data),
  });
  return bed;
}

export async function updateBed(
  id: string,
  data: { number?: string; isActive?: boolean }
) {
  const bed = await bedRepo.update(id, data);
  await auditRepo.log({
    action: "UPDATE",
    entity: "Bed",
    entityId: id,
    details: JSON.stringify(data),
  });
  return bed;
}

export async function deleteBed(id: string) {
  await bedRepo.delete(id);
  await auditRepo.log({
    action: "DELETE",
    entity: "Bed",
    entityId: id,
  });
}
