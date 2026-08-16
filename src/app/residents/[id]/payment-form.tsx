"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addPayment } from "@/actions/residents";
import { todayJalali, formatPrice } from "@/lib/utils";
import { CreditCard, Loader2, Camera, X } from "lucide-react";

export function PaymentForm({ residentId }: { residentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<"CASH" | "CARD_TO_CARD" | "POS">("CASH");
  const [description, setDescription] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayJalali());
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (receiptPhotos.length >= 5) { toast.error("حداکثر ۵ عکس مجاز است"); return; }
    const reader = new FileReader();
    reader.onload = () => setReceiptPhotos(prev => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number) => {
    setReceiptPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) { toast.error("مبلغ باید بیشتر از صفر باشد"); return; }
    setLoading(true);
    try {
      await addPayment({
        residentId,
        amount,
        method,
        description,
        paymentDate,
        receiptPhotos: JSON.stringify(receiptPhotos),
      });
      toast.success("پرداخت با موفقیت ثبت شد");
      setAmount(0);
      setDescription("");
      setReceiptPhotos([]);
      router.refresh();
    } catch {
      toast.error("خطا در ثبت پرداخت");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>مبلغ (تومان) *</Label>
          <Input type="number" value={amount || ""} onChange={e => setAmount(Number(e.target.value) || 0)}
            placeholder="مبلغ به تومان" />
        </div>
        <div className="space-y-1.5">
          <Label>روش پرداخت *</Label>
          <Select value={method} onValueChange={v => setMethod(v as typeof method)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">نقدی</SelectItem>
              <SelectItem value="CARD_TO_CARD">کارت به کارت</SelectItem>
              <SelectItem value="POS">کارتخوان</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>تاریخ پرداخت</Label>
          <Input value={paymentDate} onChange={e => setPaymentDate(e.target.value)} placeholder="۱۴۰۴-۰۲-۱۵" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>توضیحات</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات پرداخت..." />
      </div>

      {/* Receipt Photos */}
      <div className="space-y-1.5">
        <Label>عکس رسید</Label>
        <div className="flex flex-wrap gap-2">
          {receiptPhotos.map((photo, i) => (
            <div key={i} className="relative group">
              <img src={photo} alt={`رسید ${i + 1}`} className="h-20 w-20 object-cover rounded-lg border" />
              <button type="button" onClick={() => removePhoto(i)}
                className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {receiptPhotos.length < 5 && (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading} size="sm" className="w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <CreditCard className="h-4 w-4 ml-2" />}
          ثبت پرداخت
        </Button>
        {amount > 0 && <span className="text-sm text-muted-foreground">{formatPrice(amount)}</span>}
      </div>
    </form>
  );
}
