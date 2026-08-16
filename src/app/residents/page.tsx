import { AppLayout } from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import { formatJalali, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

async function getResidents(search: string) {
  const where = search
    ? {
        isActive: true,
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { nationalCode: { contains: search } },
          { phone: { contains: search } },
        ],
      }
    : { isActive: true };

  const residents = await prisma.resident.findMany({
    where,
    include: {
      residences: {
        where: { isActive: true },
        include: {
          bed: { include: { room: { include: { roomType: true } } } },
        },
      },
      payments: true,
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return residents.map((r) => {
    const totalContracts = r.residences.reduce((s, res) => s + res.contractAmount, 0);
    const totalPayments = r.payments.reduce((s, p) => s + p.amount, 0);
    const debt = totalContracts - totalPayments;
    return { ...r, totalContracts, totalPayments, debt };
  });
}

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const residents = await getResidents(q ?? "");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">ساکنین</h1>
          <Link href="/quick-checkin">
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              پذیرش سریع
            </Button>
          </Link>
        </div>

        {/* Search */}
        <form className="flex gap-2">
          <Input name="q" placeholder="جستجو... (نام، کد ملی، موبایل)" defaultValue={q} className="max-w-md" />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Resident List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residents.map((r) => (
            <Link key={r.id} href={`/residents/${r.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={r.photo} />
                      <AvatarFallback>
                        {r.firstName[0]}
                        {r.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.phone}</p>
                    </div>
                  </div>

                  {r.residences[0] && (
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        اتاق {r.residences[0].bed.room.number} • تخت{" "}
                        {r.residences[0].bed.number}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {r.residences[0].stayType === "DAILY" ? "روزانه" : "ماهانه"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          پایان: {formatJalali(r.residences[0].endDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">بدهی:</span>
                    <span
                      className={`font-bold text-sm ${
                        r.debt > 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {r.debt > 0 ? formatPrice(r.debt) : "تسویه"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {residents.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>ساکنی یافت نشد</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
