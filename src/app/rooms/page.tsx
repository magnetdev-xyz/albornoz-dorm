import { AppLayout } from "@/components/layout/app-layout";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatJalali, formatPrice, daysUntilExpiry } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getRoomsData() {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: {
      floor: true,
      roomType: true,
      beds: {
        include: {
          residences: {
            where: { isActive: true },
            include: {
              resident: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photo: true,
                },
              },
            },
          },
        },
        orderBy: { number: "asc" },
      },
    },
    orderBy: [{ floor: { order: "asc" } }, { number: "asc" }],
  });

  return rooms;
}

export default async function RoomsPage() {
  const rooms = await getRoomsData();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">اتاق‌ها</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {rooms.map((room) => {
            const occupiedBeds = room.beds.filter(
              (b) => b.residences.length > 0
            ).length;
            const totalBeds = room.beds.filter((b) => b.isActive).length;

            return (
              <Sheet key={room.id}>
                <SheetTrigger>
                  <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">اتاق {room.number}</h3>
                        <Badge variant="outline">{room.roomType.name}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        طبقه {room.floor.name}
                      </p>

                      {/* Bed Status */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {room.beds.map((bed) => {
                          const isOccupied = bed.residences.length > 0;
                          const color = !bed.isActive
                            ? "bg-gray-400"
                            : isOccupied
                            ? "bg-red-500"
                            : "bg-green-500";
                          return (
                            <div
                              key={bed.id}
                              className={`h-4 w-4 rounded-full ${color}`}
                              title={`تخت ${bed.number}: ${!bed.isActive ? "غیرفعال" : isOccupied ? "اشغال" : "خالی"}`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {occupiedBeds} / {totalBeds}
                        </span>
                        <span className="text-muted-foreground">
                          ظرفیت: {room.roomType.capacity}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </SheetTrigger>

                {/* Room Detail Drawer */}
                <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle>
                      اتاق {room.number} - {room.roomType.name}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      طبقه {room.floor.name} • ظرفیت {room.roomType.capacity} نفر
                    </p>
                  </SheetHeader>

                  <div className="space-y-4">
                    {room.beds.map((bed) => {
                      const residence = bed.residences[0];
                      return (
                        <div
                          key={bed.id}
                          className="p-4 rounded-lg border space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">
                              تخت {bed.number}
                            </span>
                            <Badge
                              variant={
                                !bed.isActive
                                  ? "secondary"
                                  : residence
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {!bed.isActive
                                ? "غیرفعال"
                                : residence
                                ? "اشغال"
                                : "خالی"}
                            </Badge>
                          </div>

                          {residence && (
                            <Link
                              href={`/residents/${residence.resident.id}`}
                              className="flex items-center gap-3 p-2 rounded bg-muted/50 hover:bg-muted"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={residence.resident.photo} />
                                <AvatarFallback>
                                  {residence.resident.firstName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {residence.resident.firstName}{" "}
                                  {residence.resident.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ورود: {formatJalali(residence.startDate)} •{" "}
                                  پایان: {formatJalali(residence.endDate)}
                                </p>
                              </div>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            );
          })}

          {rooms.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              اتاقی تعریف نشده است
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
