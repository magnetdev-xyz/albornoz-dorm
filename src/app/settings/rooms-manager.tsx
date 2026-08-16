"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRoom, updateRoom, deleteRoom } from "@/actions/rooms";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Floor {
  id: string;
  name: string;
}
interface RoomType {
  id: string;
  name: string;
}
interface Room {
  id: string;
  number: string;
  floorId: string;
  roomTypeId: string;
  description: string;
  isActive: boolean;
  floor: Floor;
  roomType: RoomType;
}

interface Props {
  rooms: Room[];
  floors: Floor[];
  roomTypes: RoomType[];
}

export function RoomsManager({ rooms: initialRooms, floors, roomTypes }: Props) {
  const router = useRouter();
  const [rooms, setRooms] = useState(initialRooms);
  const [loading, setLoading] = useState(false);

  // New room form
  const [newNumber, setNewNumber] = useState("");
  const [newFloorId, setNewFloorId] = useState("");
  const [newRoomTypeId, setNewRoomTypeId] = useState("");

  const handleCreate = async () => {
    if (!newNumber || !newFloorId || !newRoomTypeId) return;
    setLoading(true);
    try {
      await createRoom({
        number: newNumber,
        floorId: newFloorId,
        roomTypeId: newRoomTypeId,
      });
      toast.success("اتاق اضافه شد");
      setNewNumber("");
      router.refresh();
    } catch {
      toast.error("خطا");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (room: Room) => {
    try {
      await updateRoom(room.id, { isActive: !room.isActive });
      toast.success(room.isActive ? "اتاق غیرفعال شد" : "اتاق فعال شد");
      router.refresh();
    } catch {
      toast.error("خطا");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این اتاق اطمینان دارید؟")) return;
    try {
      await deleteRoom(id);
      toast.success("اتاق حذف شد");
      router.refresh();
    } catch {
      toast.error("خطا");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت اتاق‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        <div className="flex flex-wrap gap-2 items-end p-3 rounded-lg border bg-muted/30">
          <div className="space-y-1">
            <Label className="text-xs">شماره اتاق</Label>
            <Input
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="۱۰۱"
              className="w-24"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">طبقه</Label>
            <Select value={newFloorId} onValueChange={(v) => setNewFloorId(v ?? "")}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="طبقه" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">نوع اتاق</Label>
            <Select value={newRoomTypeId} onValueChange={(v) => setNewRoomTypeId(v ?? "")}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="نوع" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={loading} size="sm">
            <Plus className="h-4 w-4 ml-2" />
            افزودن
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center gap-3 p-3 rounded-lg border"
            >
              <div className="flex-1">
                <span className="font-medium">اتاق {room.number}</span>
                <span className="text-muted-foreground text-sm mr-3">
                  {room.floor.name} • {room.roomType.name}
                </span>
              </div>
              <Badge variant={room.isActive ? "default" : "secondary"}>
                {room.isActive ? "فعال" : "غیرفعال"}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleToggleActive(room)}
              >
                {room.isActive ? "غیرفعال" : "فعال"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(room.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
