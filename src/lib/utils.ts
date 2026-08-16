import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =========================================================
// Jalali Date Helpers (using jalaali-js)
// =========================================================

export function todayJalali(): string {
  const d = new Date();
  const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
}

export function formatJalali(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const months = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
  ];
  if (isNaN(y) || isNaN(m) || isNaN(d)) return date;
  return `${d} ${months[(m - 1 + 12) % 12] ?? m} ${y}`;
}

export function addDaysJalali(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const g = toGregorian(y, m, d);
  const gDate = new Date(g.gy, g.gm - 1, g.gd + days);
  const j = toJalaali(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
}

export function addMonthsJalali(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const g = toGregorian(y, m, d);
  let gm = g.gm + months;
  let gy = g.gy;
  while (gm > 12) { gm -= 12; gy++; }
  while (gm < 1) { gm += 12; gy--; }
  const jFirst = toJalaali(gy, gm, 1);
  const maxDay = jalaaliMonthLength(jFirst.jy, jFirst.jm);
  const gd = Math.min(g.gd, maxDay);
  const j = toJalaali(gy, gm, gd);
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
}

export function daysUntilExpiry(endDate: string): number {
  const [ey, em, ed] = endDate.split("-").map(Number);
  const eg = toGregorian(ey, em, ed);
  const endG = new Date(eg.gy, eg.gm - 1, eg.gd);
  const now = new Date();
  const todayG = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((endG.getTime() - todayG.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpired(endDate: string): boolean {
  return daysUntilExpiry(endDate) < 0;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

// =========================================================
// Jalali date parts helper
// =========================================================
export function getJalaliParts(date: string): { year: number; month: number; day: number } | null {
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
}
