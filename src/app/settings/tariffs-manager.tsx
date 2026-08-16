"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateTariff } from "@/actions/settings";
import { Save } from "lucide-react";

interface Tariff {
  id: string;
  roomTypeId: string;
  stayType: string;
  price: number;
  isActive: boolean;
}

interface RoomType {
  id: string;
  name: string;
  tariffs: Tariff[];
}

export function TariffsManager({ roomTypes }: { roomTypes: RoomType[] }) {
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const rt of roomTypes) {
      for (const t of rt.tariffs) {
        init[t.id] = t.price;
      }
    }
    return init;
  });

  const handleSave = async (tariff: Tariff, price: number) => {
    try {
      await updateTariff({
        id: tariff.id,
        roomTypeId: tariff.roomTypeId,
        stayType: tariff.stayType,
        price,
      });
      toast.success("تعرفه ذخیره شد");
    } catch {
      toast.error("خطا");
    }
  };

  return (
    <div className="space-y-4">
      {roomTypes.map((rt) => (
        <Card key={rt.id}>
          <CardHeader>
            <CardTitle className="text-lg">{rt.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rt.tariffs
              .filter((t) => t.isActive)
              .map((tariff) => (
                <div
                  key={tariff.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Label className="w-24">
                    {tariff.stayType === "DAILY" ? "روزانه" : "ماهانه"}
                  </Label>
                  <Input
                    type="number"
                    value={prices[tariff.id] ?? tariff.price}
                    onChange={(e) =>
                      setPrices((p) => ({
                        ...p,
                        [tariff.id]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="max-w-[180px]"
                  />
                  <span className="text-sm text-muted-foreground">تومان</span>
                  <Button
                    size="sm"
                    onClick={() => handleSave(tariff, prices[tariff.id] ?? tariff.price)}
                  >
                    <Save className="h-4 w-4 ml-2" />
                    ذخیره
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
