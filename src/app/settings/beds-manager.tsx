"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createBed, updateBed, deleteBed } from "@/actions/rooms";
import { Plus, Trash2 } from "lucide-react";

interface Room {
  id: string;
  number: string;
  floor: { name: string };
  roomType: { name: string };
  beds: { id: string; number: string; isActive: boolean }[];
}

export function BedsManager({ rooms }: { rooms: Room[] }) {
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [newBedNumber, setNewBedNumber] = useState("");

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const handleCreate = async () => {
    if (!newBedNumber || !selectedRoomId) return;
    try {
      await createBed({ number: newBedNumber, roomId: selectedRoomId });
      toast.success("تخت اضافه شد");
      setNewBedNumber("");
      router.refresh();
    } catch {
      toast.error("خطا");
    }
  };

  const handleToggleActive = async (bed: { id: string; isActive: boolean }) => {
    try {
      await updateBed(bed.id, { isActive: !bed.isActive });
      router.refresh();
    } catch {
      toast.error("خطا");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف تخت؟")) return;
    try {
      await deleteBed(id);
      router.refresh();
    } catch {
      toast.error("خطا");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت تخت‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>انتخاب اتاق</Label>
          <Select value={selectedRoomId} onValueChange={(v) => setSelectedRoomId(v ?? "")}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="اتاق را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  اتاق {r.number} - {r.floor.name} ({r.roomType.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRoom && (
          <>
            <div className="flex gap-2">
              <Input
                value={newBedNumber}
                onChange={(e) => setNewBedNumber(e.target.value)}
                placeholder="شماره تخت (مثلاً ۱۰۱-۱)"
                className="max-w-xs"
              />
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 ml-2" />
                افزودن
              </Button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {selectedRoom.beds.map((bed) => (
                <div
                  key={bed.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{bed.number}</span>
                    <Badge variant={bed.isActive ? "default" : "secondary"} className="text-xs">
                      {bed.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-xs"
                      onClick={() => handleToggleActive(bed)}
                    >
                      {bed.isActive ? "⚫" : "🟢"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDelete(bed.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
