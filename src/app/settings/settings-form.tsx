"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/actions/settings";
import { Loader2, Save } from "lucide-react";

interface Props {
  settings: { id: number; dormName: string; logo: string } | null;
}

export function SettingsForm({ settings }: Props) {
  const [name, setName] = useState(settings?.dormName ?? "خوابگاه البرز");
  const [logo, setLogo] = useState(settings?.logo ?? "");
  const [loading, setLoading] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({ dormName: name, logo });
      toast.success("تنظیمات ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>مشخصات خوابگاه</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>نام خوابگاه</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>لوگو</Label>
          <Input type="file" accept="image/*" onChange={handleLogoChange} />
          {logo && (
            <img src={logo} alt="لوگو" className="h-16 w-16 object-cover rounded border mt-2" />
          )}
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
          ذخیره
        </Button>
      </CardContent>
    </Card>
  );
}
