// =========================================================
// Shared Types for Albornoz Dorm Management System
// =========================================================

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  nationalCode: string;
  phone: string;
  photo: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  number: string;
  floorId: string;
  roomTypeId: string;
  description: string;
  isActive: boolean;
  floor?: Floor;
  roomType?: RoomType;
  beds?: Bed[];
}

export interface Floor {
  id: string;
  name: string;
  order: number;
}

export interface RoomType {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  tariffs?: Tariff[];
}

export interface Tariff {
  id: string;
  roomTypeId: string;
  stayType: "DAILY" | "MONTHLY";
  price: number;
  isActive: boolean;
}

export interface Bed {
  id: string;
  number: string;
  roomId: string;
  isActive: boolean;
  room?: Room;
  residences?: Residence[];
}

export interface Residence {
  id: string;
  residentId: string;
  bedId: string;
  stayType: "DAILY" | "MONTHLY";
  startDate: string;
  endDate: string;
  contractAmount: number;
  isActive: boolean;
  isCheckedOut: boolean;
  checkoutDate: string | null;
  description: string;
  resident?: Resident;
  bed?: Bed;
  extensions?: Extension[];
}

export interface Extension {
  id: string;
  residenceId: string;
  days: number;
  newEndDate: string;
  description: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  residentId: string;
  amount: number;
  method: "CASH" | "CARD_TO_CARD" | "POS";
  trackingNumber: string;
  description: string;
  receiptPhotos: string;
  paymentDate: string;
  resident?: Resident;
}

export interface Document {
  id: string;
  residentId: string;
  nationalCard: boolean;
  birthCert: boolean;
  driverLicense: boolean;
  militaryCard: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: Date;
}

export interface Settings {
  id: number;
  dormName: string;
  logo: string;
}

export interface Debtor {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  totalContracts: number;
  totalPayments: number;
  debt: number;
}

export interface DashboardStats {
  totalResidents: number;
  totalRooms: number;
  emptyBeds: number;
  occupiedBeds: number;
  debtorsCount: number;
  recentPayments: Payment[];
  expiringResidences: Residence[];
}

export const PAYMENT_METHODS = {
  CASH: "نقدی",
  CARD_TO_CARD: "کارت به کارت",
  POS: "کارتخوان",
} as const;

export const STAY_TYPES = {
  DAILY: "روزانه",
  MONTHLY: "ماهانه",
} as const;
