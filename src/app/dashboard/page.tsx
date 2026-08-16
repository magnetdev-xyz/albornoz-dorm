import { AppLayout } from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import { todayJalali, formatJalali, formatPrice, daysUntilExpiry } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, BedSingle, BedDouble, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const today = todayJalali();
  const [totalResidents, totalRooms, totalBeds, occupiedBeds, recentPayments, allResidents] = await Promise.all([
    prisma.resident.count({ where: { isActive: true } }),
    prisma.room.count({ where: { isActive: true } }),
    prisma.bed.count({ where: { isActive: true } }),
    prisma.residence.count({ where: { isActive: true } }),
    prisma.payment.findMany({
      include: { resident: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" }, take: 5,
    }),
    prisma.resident.findMany({
      where: { isActive: true },
      include: { residences: { where: { isActive: true } }, payments: true },
    }),
  ]);

  const emptyBeds = totalBeds - occupiedBeds;
  const debtors = allResidents
    .map(r => {
      const tc = r.residences.reduce((s, x) => s + x.contractAmount, 0);
      const tp = r.payments.reduce((s, x) => s + x.amount, 0);
      return { ...r, debt: tc - tp };
    })
    .filter(r => r.debt > 0).sort((a, b) => b.debt - a.debt);

  const expiringResidences = await prisma.residence.findMany({
    where: { isActive: true },
    include: {
      resident: { select: { id: true, firstName: true, lastName: true, phone: true } },
      bed: { include: { room: { select: { number: true } } } },
    },
  });
  const expiringSoon = expiringResidences.filter(r => {
    const d = daysUntilExpiry(r.endDate);
    return d >= 0 && d <= 3;
  });

  return { totalResidents, totalRooms, totalBeds, occupiedBeds, emptyBeds, debtorsCount: debtors.length, recentPayments, expiringSoon };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats = [
    { title: "ساکنین", value: data.totalResidents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "اتاق‌ها", value: data.totalRooms, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "تخت خالی", value: data.emptyBeds, icon: BedSingle, color: "text-green-600", bg: "bg-green-50" },
    { title: "تخت اشغال", value: data.occupiedBeds, icon: BedDouble, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "بدهکار", value: data.debtorsCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-bold">داشبورد</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map(stat => (
            <Card key={stat.title} className="overflow-hidden border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight">{stat.value.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expiring Soon */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">اتمام اقامت (۳ روز آینده)</CardTitle></CardHeader>
            <CardContent>
              {data.expiringSoon.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">موردی یافت نشد</p>
              ) : (
                <div className="space-y-1.5">
                  {data.expiringSoon.map(r => (
                    <Link key={r.id} href={`/residents/${r.resident.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.resident.firstName} {r.resident.lastName}</p>
                        <p className="text-xs text-muted-foreground">اتاق {r.bed.room.number}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {daysUntilExpiry(r.endDate)} روز
                        </Badge>
                        <ArrowLeft className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">پرداخت‌های اخیر</CardTitle></CardHeader>
            <CardContent>
              {data.recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">پرداختی ثبت نشده</p>
              ) : (
                <div className="space-y-1.5">
                  {data.recentPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.resident.firstName} {p.resident.lastName}</p>
                        <p className="text-xs text-muted-foreground">{formatJalali(p.paymentDate)}</p>
                      </div>
                      <p className="font-bold text-sm text-emerald-600 shrink-0">{formatPrice(p.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
