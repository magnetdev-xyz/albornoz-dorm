"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createFloor, updateFloor, deleteFloor } from "@/actions/rooms";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Floor {
  id: string;
  name: string;
  order: number;
}

export function FloorsManager({ floors: initialFloors }: { floors: Floor[] }) {
  const router = useRouter();
  const [floors, setFloors] = useState(initialFloors);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await createFloor({ name: newName, order: floors.length });
      toast.success("طبقه اضافه شد");
      setNewName("");
      router.refresh();
    } catch {
      toast.error("خطا");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setLoading(true);
    try {
      await updateFloor(id, { name: editingName });
      toast.success("ویرایش شد");
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("خطا");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این طبقه اطمینان دارید؟")) return;
    setLoading(true);
    try {
      await deleteFloor(id);
      toast.success("طبقه حذف شد");
      router.refresh();
    } catch {
      toast.error("خطا");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>مدیریت طبقات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="نام طبقه جدید"
            className="max-w-xs"
          />
          <Button onClick={handleCreate} disabled={loading}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن
          </Button>
        </div>

        <div className="space-y-2">
          {floors.map((floor) => (
            <div
              key={floor.id}
              className="flex items-center gap-2 p-3 rounded-lg border"
            >
              {editingId === floor.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button size="sm" onClick={() => handleUpdate(floor.id)} disabled={loading}>
                    ذخیره
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    انصراف
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{floor.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(floor.id);
                      setEditingName(floor.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(floor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
