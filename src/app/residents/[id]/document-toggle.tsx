"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateDocuments } from "@/actions/residents";

interface DocumentData {
  id: string;
  residentId: string;
  nationalCard: boolean;
  birthCert: boolean;
  driverLicense: boolean;
  militaryCard: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function DocumentToggle({
  residentId,
  documents,
}: {
  residentId: string;
  documents: DocumentData;
}) {
  const [docs, setDocs] = useState(documents);

  const toggle = async (field: keyof DocumentData, value: boolean) => {
    const newDocs = { ...docs, [field]: value };
    setDocs(newDocs);
    try {
      await updateDocuments(residentId, { [field]: value });
    } catch {
      toast.error("خطا در به‌روزرسانی");
      setDocs(docs);
    }
  };

  const items = [
    { key: "nationalCard" as const, label: "کارت ملی" },
    { key: "birthCert" as const, label: "شناسنامه" },
    { key: "driverLicense" as const, label: "گواهینامه" },
    { key: "militaryCard" as const, label: "کارت پایان خدمت" },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between py-2 border-b last:border-b-0"
        >
          <Label className="cursor-pointer">{item.label}</Label>
          <Switch
            checked={docs[item.key] as boolean}
            onCheckedChange={(v) => toggle(item.key, v)}
          />
        </div>
      ))}
    </div>
  );
}
