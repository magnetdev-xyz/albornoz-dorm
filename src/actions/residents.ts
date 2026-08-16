"use server";

import { residentRepo } from "@/repositories/residents";
import { residenceRepo } from "@/repositories/residences";
import { documentRepo } from "@/repositories/documents";
import { paymentRepo } from "@/repositories/payments";
import { auditRepo } from "@/repositories/audit";
import { bedRepo } from "@/repositories/rooms";
import { addDaysJalali, addMonthsJalali } from "@/lib/utils";

// =========================================================
// Resident Actions
// =========================================================
export async function createResident(data: {
  firstName: string;
  lastName: string;
  fatherName: string;
  nationalCode: string;
  phone: string;
  photo?: string;
}) {
  const resident = await residentRepo.create(data);
  await auditRepo.log({
    action: "CREATE",
    entity: "Resident",
    entityId: resident.id,
    details: JSON.stringify({ firstName: data.firstName, lastName: data.lastName }),
  });
  return resident;
}

export async function updateResident(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    nationalCode?: string;
    phone?: string;
    photo?: string;
  }
) {
  const resident = await residentRepo.update(id, data);
  await auditRepo.log({
    action: "UPDATE",
    entity: "Resident",
    entityId: id,
    details: JSON.stringify(data),
  });
  return resident;
}

// =========================================================
// Check-in Action
// =========================================================
export async function quickCheckin(data: {
  firstName: string;
  lastName: string;
  fatherName: string;
  nationalCode: string;
  phone: string;
  photo?: string;
  bedId: string;
  stayType: string;
  startDate: string;
  duration: number;
  contractAmount: number;
  description?: string;
  documents?: {
    nationalCard?: boolean;
    birthCert?: boolean;
    driverLicense?: boolean;
    militaryCard?: boolean;
  };
}) {
  // 1. Create or get resident
  let resident = await residentRepo.getByNationalCode(data.nationalCode);
  if (!resident) {
    resident = await residentRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName,
      nationalCode: data.nationalCode,
      phone: data.phone,
      photo: data.photo,
    });
  } else {
    // Update info
    resident = await residentRepo.update(resident.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      fatherName: data.fatherName,
      phone: data.phone,
      photo: data.photo,
    });
  }

  // 2. Check if already has active residence
  const activeResidence = await residenceRepo.getActiveByResident(resident.id);
  if (activeResidence) {
    throw new Error("این فرد قبلاً اقامت فعال دارد. لطفاً ابتدا خروج ثبت شود.");
  }

  // 3. Calculate end date
  const endDate =
    data.stayType === "MONTHLY"
      ? addMonthsJalali(data.startDate, data.duration)
      : addDaysJalali(data.startDate, data.duration);

  // 4. Create residence
  const residence = await residenceRepo.create({
    residentId: resident.id,
    bedId: data.bedId,
    stayType: data.stayType,
    startDate: data.startDate,
    endDate,
    contractAmount: data.contractAmount,
    description: data.description,
  });

  // 5. Initialize documents with check-in values
  if (data.documents) {
    await documentRepo.upsert(resident.id, data.documents);
  } else {
    await documentRepo.upsert(resident.id, {});
  }

  // 6. Audit
  await auditRepo.log({
    action: "CREATE",
    entity: "Residence",
    entityId: residence.id,
    details: JSON.stringify({
      residentId: resident.id,
      bedId: data.bedId,
      stayType: data.stayType,
      contractAmount: data.contractAmount,
    }),
  });

  return { resident, residence };
}

// =========================================================
// Check-out Action
// =========================================================
export async function checkoutResident(residenceId: string, checkoutDate: string) {
  const residence = await residenceRepo.getById(residenceId);
  if (!residence) throw new Error("اقامت یافت نشد");

  // Check documents
  const docs = await documentRepo.getByResident(residence.residentId);
  const heldDocs: string[] = [];
  if (docs?.nationalCard) heldDocs.push("کارت ملی");
  if (docs?.birthCert) heldDocs.push("شناسنامه");
  if (docs?.driverLicense) heldDocs.push("گواهینامه");
  if (docs?.militaryCard) heldDocs.push("کارت پایان خدمت");

  await residenceRepo.checkout(residenceId, checkoutDate);

  await auditRepo.log({
    action: "CHECKOUT",
    entity: "Residence",
    entityId: residenceId,
    details: JSON.stringify({ checkoutDate, heldDocuments: heldDocs }),
  });

  return { heldDocs };
}

// =========================================================
// Extend Residence
// =========================================================
export async function extendResidence(
  residenceId: string,
  days: number,
  description?: string
) {
  const residence = await residenceRepo.getById(residenceId);
  if (!residence) throw new Error("اقامت یافت نشد");

  const newEndDate = addDaysJalali(residence.endDate, days);

  await residenceRepo.extend(residenceId, days, newEndDate);
  await residenceRepo.addExtension({
    residenceId,
    days,
    newEndDate,
    description,
  });

  await auditRepo.log({
    action: "EXTEND",
    entity: "Residence",
    entityId: residenceId,
    details: JSON.stringify({ days, newEndDate, description }),
  });

  return { newEndDate };
}

// =========================================================
// Change Bed
// =========================================================
export async function changeBed(residenceId: string, newBedId: string) {
  const oldResidence = await residenceRepo.getById(residenceId);
  if (!oldResidence) throw new Error("اقامت یافت نشد");

  await residenceRepo.changeBed(residenceId, newBedId);

  await auditRepo.log({
    action: "BED_CHANGE",
    entity: "Residence",
    entityId: residenceId,
    details: JSON.stringify({ oldBedId: oldResidence.bedId, newBedId }),
  });

  return { success: true };
}

// =========================================================
// Payment Actions
// =========================================================
export async function addPayment(data: {
  residentId: string;
  amount: number;
  method: string;
  trackingNumber?: string;
  description?: string;
  receiptPhotos?: string;
  paymentDate: string;
}) {
  const payment = await paymentRepo.create(data);

  await auditRepo.log({
    action: "PAYMENT",
    entity: "Payment",
    entityId: payment.id,
    details: JSON.stringify({
      residentId: data.residentId,
      amount: data.amount,
      method: data.method,
    }),
  });

  return payment;
}

// =========================================================
// Document Actions
// =========================================================
export async function updateDocuments(
  residentId: string,
  data: {
    nationalCard?: boolean;
    birthCert?: boolean;
    driverLicense?: boolean;
    militaryCard?: boolean;
  }
) {
  await documentRepo.upsert(residentId, data);
  await auditRepo.log({
    action: "UPDATE",
    entity: "Document",
    entityId: residentId,
    details: JSON.stringify(data),
  });
}
