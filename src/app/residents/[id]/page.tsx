import { AppLayout } from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import { formatJalali, formatPrice, daysUntilExpiry } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResidentActions } from "./actions";
import { PaymentForm } from "./payment-form";
import { DocumentToggle } from "./document-toggle";

export const dynamic = "force-dynamic";

async function getResidentData(id: string) {
  const resident = await prisma.resident.findUnique({
    where: { id },
    include: {
      documents: true,
      residences: {
        include: {
          bed: { include: { room: { include: { roomType: true, floor: true } } } },
          extensions: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
  if (!resident) return null;

  const totalContracts = resident.residences.reduce((s, r) => s + r.contractAmount, 0);
  const totalPayments = resident.payments.reduce((s, p) => s + p.amount, 0);
  const debt = totalContracts - totalPayments;

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { ...resident, totalContracts, totalPayments, debt, auditLogs };
}

const actionLabels: Record<string, string> = {
  CREATE: "ایجاد اقامت", UPDATE: "ویرایش", DELETE: "حذف", CHECKOUT: "خروج",
  EXTEND: "تمدید", PAYMENT: "پرداخت", BED_CHANGE: "جابجایی تخت",
};

export default async function ResidentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resident = await getResidentData(id);
  if (!resident) notFound();

  const activeResidence = resident.residences.find(r => r.isActive);
  const docs = resident.documents?.[0] ?? null;

  const heldDocs: string[] = [];
  if (docs?.nationalCard) heldDocs.push("کارت ملی");
  if (docs?.birthCert) heldDocs.push("شناسنامه");
  if (docs?.driverLicense) heldDocs.push("گواهینامه");
  if (docs?.militaryCard) heldDocs.push("کارت پایان خدمت");

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="bg-gradient-to-l from-primary/5 to-transparent p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-background shadow-md shrink-0">
                <AvatarImage src={resident.photo} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                  {resident.firstName[0]}{resident.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">{resident.firstName} {resident.lastName}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                  <span>{resident.nationalCode}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{resident.phone}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>فرزند {resident.fatherName}</span>
                </div>
                {/* Debt badge */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {resident.debt > 0 ? (
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      بدهی: {formatPrice(resident.debt)}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-sm px-3 py-1 bg-emerald-500">
                      تسویه
                    </Badge>
                  )}
                  {activeResidence && (
                    <Badge variant="outline" className="text-sm">
                      {activeResidence.stayType === "DAILY" ? "روزانه" : "ماهانه"}
                    </Badge>
                  )}
                </div>
              </div>
              {activeResidence && (
                <div className="shrink-0 self-end sm:self-center">
                  <ResidentActions
                    residenceId={activeResidence.id}
                    currentEndDate={activeResidence.endDate}
                    heldDocs={heldDocs}
                    totalContracts={resident.totalContracts}
                    totalPayments={resident.totalPayments}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="info" className="text-xs sm:text-sm">اطلاعات اقامت</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm">مدارک</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">پرداخت‌ها</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">تاریخچه</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-4 space-y-4">
            {activeResidence ? (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">اقامت فعال</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <InfoItem label="اتاق" value={activeResidence.bed.room.number} />
                    <InfoItem label="تخت" value={activeResidence.bed.number} />
                    <InfoItem label="طبقه" value={activeResidence.bed.room.floor.name} />
                    <InfoItem label="مبلغ" value={formatPrice(activeResidence.contractAmount)} />
                    <InfoItem label="ورود" value={formatJalali(activeResidence.startDate)} />
                    <InfoItem label="پایان" value={formatJalali(activeResidence.endDate)} />
                    <InfoItem label="بدهی" value={resident.debt > 0 ? formatPrice(resident.debt) : "تسویه"} highlight={resident.debt > 0} />
                    <InfoItem label="مدت باقی‌مانده" value={daysUntilExpiry(activeResidence.endDate) + " روز"} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">اقامت فعالی وجود ندارد</CardContent>
              </Card>
            )}

            {/* Extensions */}
            {activeResidence && activeResidence.extensions.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-base">تمدیدها</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {activeResidence.extensions.map(ext => (
                      <div key={ext.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                        <span>+{ext.days} روز → {formatJalali(ext.newEndDate)}</span>
                        {ext.description && <span className="text-xs text-muted-foreground">{ext.description}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">مدارک تحویلی</CardTitle></CardHeader>
              <CardContent>
                <DocumentToggle residentId={resident.id} documents={docs ?? {
                  id: "", residentId: resident.id,
                  nationalCard: false, birthCert: false, driverLicense: false, militaryCard: false,
                  createdAt: new Date(), updatedAt: new Date(),
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-4 space-y-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">ثبت پرداخت</CardTitle></CardHeader>
              <CardContent><PaymentForm residentId={resident.id} /></CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">پرداخت‌های قبلی</CardTitle></CardHeader>
              <CardContent>
                {resident.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">پرداختی ثبت نشده</p>
                ) : (
                  <div className="space-y-2">
                    {resident.payments.map(p => {
                      const photos: string[] = (() => { try { return JSON.parse(p.receiptPhotos); } catch { return []; } })();
                      return (
                        <div key={p.id} className="flex items-start justify-between p-3 rounded-lg border border-border/50">
                          <div>
                            <p className="font-bold text-sm">{formatPrice(p.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatJalali(p.paymentDate)} • {p.method === "CASH" ? "نقدی" : p.method === "CARD_TO_CARD" ? "کارت به کارت" : "کارتخوان"}
                            </p>
                            {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                          </div>
                          {photos.length > 0 && (
                            <div className="flex gap-1">
                              {photos.slice(0, 3).map((ph, i) => (
                                <img key={i} src={ph} alt="" className="h-10 w-10 object-cover rounded border" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">تاریخچه</CardTitle></CardHeader>
              <CardContent>
                {resident.auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">تاریخچه‌ای ثبت نشده</p>
                ) : (
                  <div className="space-y-1.5">
                    {resident.auditLogs.map(log => (
                      <div key={log.id} className="flex items-center gap-3 text-xs p-2.5 rounded-lg bg-muted/30">
                        <Badge variant="outline" className="text-xs shrink-0">{actionLabels[log.action] ?? log.action}</Badge>
                        <span className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("fa-IR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Helper
function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
