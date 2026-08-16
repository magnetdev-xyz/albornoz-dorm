"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: Date;
}

const actionLabels: Record<string, string> = {
  CREATE: "ایجاد",
  UPDATE: "ویرایش",
  DELETE: "حذف",
  CHECKOUT: "خروج",
  EXTEND: "تمدید",
  PAYMENT: "پرداخت",
  BED_CHANGE: "جابجایی تخت",
  SETTINGS: "تنظیمات",
};

const entityLabels: Record<string, string> = {
  Resident: "ساکن",
  Room: "اتاق",
  Bed: "تخت",
  Payment: "پرداخت",
  Settings: "تنظیمات",
  Residence: "اقامت",
  Floor: "طبقه",
  Document: "مدارک",
  Tariff: "تعرفه",
};

export function AuditLogViewer({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>گزارش فعالیت‌ها</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg border text-sm"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {actionLabels[log.action] ?? log.action}
                  </Badge>
                  <span className="text-muted-foreground">
                    {entityLabels[log.entity] ?? log.entity}
                  </span>
                  {log.entityId && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.entityId.slice(0, 8)}...
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("fa-IR")}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                گزارشی ثبت نشده
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
