import { AppLayout } from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import { formatJalali, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";
import { NewPaymentDialog } from "./new-payment-dialog";

export const dynamic = "force-dynamic";

async function getPayments(search: string) {
  const where = search ? {
    OR: [
      { resident: { firstName: { contains: search } } },
      { resident: { lastName: { contains: search } } },
      { description: { contains: search } },
    ],
  } : {};
  return prisma.payment.findMany({
    where,
    include: { resident: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { paymentDate: "desc" },
    take: 200,
  });
}

const methodLabels: Record<string, string> = {
  CASH: "نقدی", CARD_TO_CARD: "کارت به کارت", POS: "کارتخوان",
};

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const payments = await getPayments(q ?? "");

  // Get residents for new payment dialog
  const residents = await prisma.resident.findMany({
    where: { isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">پرداخت‌ها</h1>
          <NewPaymentDialog residents={residents} />
        </div>

        <form className="flex gap-2">
          <Input name="q" placeholder="جستجو..." defaultValue={q} className="max-w-md" />
          <Button type="submit" variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
        </form>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-right p-3 font-medium">ساکن</th>
                    <th className="text-right p-3 font-medium">مبلغ</th>
                    <th className="text-right p-3 font-medium">روش</th>
                    <th className="text-right p-3 font-medium">تاریخ</th>
                    <th className="text-right p-3 font-medium">توضیحات</th>
                    <th className="text-right p-3 font-medium">رسید</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const photos: string[] = (() => { try { return JSON.parse(p.receiptPhotos); } catch { return []; } })();
                    return (
                      <tr key={p.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <Link href={`/residents/${p.resident.id}`} className="text-primary hover:underline font-medium">
                            {p.resident.firstName} {p.resident.lastName}
                          </Link>
                        </td>
                        <td className="p-3 font-bold">{formatPrice(p.amount)}</td>
                        <td className="p-3"><Badge variant="outline">{methodLabels[p.method] ?? p.method}</Badge></td>
                        <td className="p-3">{formatJalali(p.paymentDate)}</td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{p.description || "-"}</td>
                        <td className="p-3">
                          {photos.length > 0 ? (
                            <span className="text-xs text-primary">{photos.length} عکس</span>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {payments.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">پرداختی یافت نشد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
