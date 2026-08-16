import { AppLayout } from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatJalali } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getData(search: string) {
  // Debtors
  const residents = await prisma.resident.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      residences: { where: { isActive: true } },
      payments: true,
    },
  });

  const debtors = residents
    .map((r) => {
      const totalContracts = r.residences.reduce((s, res) => s + res.contractAmount, 0);
      const totalPayments = r.payments.reduce((s, p) => s + p.amount, 0);
      return {
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        phone: r.phone,
        totalContracts,
        totalPayments,
        debt: totalContracts - totalPayments,
      };
    })
    .filter((r) => r.debt > 0)
    .sort((a, b) => b.debt - a.debt);

  // All payments
  const payments = await prisma.payment.findMany({
    include: {
      resident: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 100,
  });

  return { debtors, payments };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { debtors, payments } = await getData(q ?? "");

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">گزارش مالی</h1>

        <form className="flex gap-2">
          <Input
            name="q"
            placeholder="جستجو..."
            defaultValue={q}
            className="max-w-md"
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Debtors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              بدهکاران
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <p className="text-muted-foreground text-sm">بدهکاری وجود ندارد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-right p-3 font-medium">ساکن</th>
                      <th className="text-right p-3 font-medium">موبایل</th>
                      <th className="text-right p-3 font-medium">جمع قراردادها</th>
                      <th className="text-right p-3 font-medium">جمع پرداخت‌ها</th>
                      <th className="text-right p-3 font-medium">بدهی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtors.map((d) => (
                      <tr key={d.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <Link
                            href={`/residents/${d.id}`}
                            className="text-primary hover:underline"
                          >
                            {d.firstName} {d.lastName}
                          </Link>
                        </td>
                        <td className="p-3">{d.phone}</td>
                        <td className="p-3">{formatPrice(d.totalContracts)}</td>
                        <td className="p-3">{formatPrice(d.totalPayments)}</td>
                        <td className="p-3">
                          <Badge variant="destructive">{formatPrice(d.debt)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ریز پرداخت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-right p-3 font-medium">تاریخ</th>
                    <th className="text-right p-3 font-medium">ساکن</th>
                    <th className="text-right p-3 font-medium">مبلغ</th>
                    <th className="text-right p-3 font-medium">روش</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{formatJalali(p.paymentDate)}</td>
                      <td className="p-3">
                        <Link
                          href={`/residents/${p.resident.id}`}
                          className="text-primary hover:underline"
                        >
                          {p.resident.firstName} {p.resident.lastName}
                        </Link>
                      </td>
                      <td className="p-3">{formatPrice(p.amount)}</td>
                      <td className="p-3">
                        {p.method === "CASH"
                          ? "نقدی"
                          : p.method === "CARD_TO_CARD"
                          ? "کارت به کارت"
                          : "کارتخوان"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
