"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extendResidence, checkoutResident } from "@/actions/residents";
import { todayJalali } from "@/lib/utils";
import { CalendarPlus, LogOut, Loader2 } from "lucide-react";

interface Props {
  residenceId: string;
  currentEndDate: string;
  heldDocs: string[];
  totalContracts: number;
  totalPayments: number;
}

export function ResidentActions({
  residenceId,
  currentEndDate,
  heldDocs,
  totalContracts,
  totalPayments,
}: Props) {
  const router = useRouter();
  const [extendOpen, setExtendOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtend = async () => {
    const days = extendDays === -1 ? parseInt(customDays) : extendDays;
    if (!days || days < 1) return;

    setLoading(true);
    try {
      await extendResidence(residenceId, days);
      toast.success(`${days} روز تمدید شد`);
      setExtendOpen(false);
      router.refresh();
    } catch {
      toast.error("خطا در تمدید");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const result = await checkoutResident(residenceId, todayJalali());
      if (result.heldDocs.length > 0) {
        toast.warning(`توجه: مدارک زیر هنوز تحویل خوابگاه است: ${result.heldDocs.join("، ")}`);
      } else {
        toast.success("خروج با موفقیت ثبت شد");
      }
      setCheckoutOpen(false);
      router.refresh();
    } catch {
      toast.error("خطا در ثبت خروج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Extend Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogTrigger>
          <Button variant="outline" size="sm">
            <CalendarPlus className="h-4 w-4 ml-2" />
            تمدید
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تمدید اقامت</DialogTitle>
            <DialogDescription>
              تاریخ پایان فعلی: {currentEndDate}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>مدت تمدید</Label>
              <Select
                value={extendDays.toString()}
                onValueChange={(v) => setExtendDays(parseInt(v ?? "30"))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">۷ روز</SelectItem>
                  <SelectItem value="14">۱۴ روز</SelectItem>
                  <SelectItem value="30">۳۰ روز</SelectItem>
                  <SelectItem value="-1">تعداد روز دلخواه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {extendDays === -1 && (
              <div className="space-y-2">
                <Label>تعداد روز</Label>
                <Input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="تعداد روز"
                  min={1}
                />
              </div>
            )}

            <Button onClick={handleExtend} className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تایید تمدید
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogTrigger>
          <Button variant="destructive" size="sm">
            <LogOut className="h-4 w-4 ml-2" />
            ثبت خروج
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت خروج ساکن</DialogTitle>
            <DialogDescription>
              آیا از ثبت خروج اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>

          {heldDocs.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
              توجه: مدارک زیر هنوز تحویل خوابگاه است:
              <br />
              {heldDocs.join("، ")}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            مجموع قراردادها: {(totalContracts || 0).toLocaleString("fa-IR")} تومان
            <br />
            مجموع پرداخت‌ها: {(totalPayments || 0).toLocaleString("fa-IR")} تومان
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCheckoutOpen(false)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تایید خروج
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
