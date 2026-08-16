import { AppLayout } from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsForm } from "./settings-form";
import { FloorsManager } from "./floors-manager";
import { RoomsManager } from "./rooms-manager";
import { BedsManager } from "./beds-manager";
import { TariffsManager } from "./tariffs-manager";
import { AuditLogViewer } from "./audit-log-viewer";

export const dynamic = "force-dynamic";

async function getSettings() {
  return prisma.settings.findFirst({ where: { id: 1 } });
}

async function getFloors() {
  return prisma.floor.findMany({ orderBy: { order: "asc" } });
}

async function getRoomTypes() {
  return prisma.roomType.findMany({ include: { tariffs: true } });
}

async function getRooms() {
  return prisma.room.findMany({
    include: { floor: true, roomType: true, beds: { orderBy: { number: "asc" } } },
    orderBy: [{ floor: { order: "asc" } }, { number: "asc" }],
  });
}

async function getAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

export default async function SettingsPage() {
  const [settings, floors, roomTypes, rooms, auditLogs] = await Promise.all([
    getSettings(),
    getFloors(),
    getRoomTypes(),
    getRooms(),
    getAuditLogs(),
  ]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">تنظیمات</h1>

        <Tabs defaultValue="general">
          <TabsList className="w-full justify-start flex-wrap">
            <TabsTrigger value="general">عمومی</TabsTrigger>
            <TabsTrigger value="floors">طبقات</TabsTrigger>
            <TabsTrigger value="rooms">اتاق‌ها</TabsTrigger>
            <TabsTrigger value="beds">تخت‌ها</TabsTrigger>
            <TabsTrigger value="tariffs">تعرفه‌ها</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <SettingsForm settings={settings} />
          </TabsContent>

          <TabsContent value="floors" className="mt-4">
            <FloorsManager floors={floors} />
          </TabsContent>

          <TabsContent value="rooms" className="mt-4">
            <RoomsManager rooms={rooms} floors={floors} roomTypes={roomTypes} />
          </TabsContent>

          <TabsContent value="beds" className="mt-4">
            <BedsManager rooms={rooms} />
          </TabsContent>

          <TabsContent value="tariffs" className="mt-4">
            <TariffsManager roomTypes={roomTypes} />
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <AuditLogViewer logs={auditLogs} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
