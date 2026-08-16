"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { addPayment } from "@/actions/residents";
import { todayJalali } from "@/lib/utils";
import { Plus, Loader2, Camera, X } from "lucide-react";

interface ResidentItem { id: string; firstName: string; lastName: string; }

export function NewPaymentDialog({ residents }: { residents: ResidentItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [residentId, setResidentId] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<"CASH" | "CARD_TO_CARD" | "POS">("CASH");
  const [description, setDescription] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayJalali());
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (receiptPhotos.length >= 5) { toast.error("حداکثر ۵ عکس"); return; }
    const reader = new FileReader();
    reader.onload = () => setReceiptPhotos(prev => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!residentId) { toast.error("ساکن را انتخاب کنید"); return; }
    if (amount <= 0) { toast.error("مبلغ باید بیشتر از صفر باشد"); return; }
    setLoading(true);
    try {
      await addPayment({ residentId, amount, method, description, paymentDate, receiptPhotos: JSON.stringify(receiptPhotos) });
      toast.success("پرداخت ثبت شد");
      setOpen(false); setAmount(0); setDescription(""); setReceiptPhotos([]); setResidentId("");
      router.refresh();
    } catch { toast.error("خطا"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 ml-2" />ثبت پرداخت جدید</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>ثبت پرداخت جدید</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>ساکن *</Label>
            <Select value={residentId} onValueChange={v => setResidentId(v ?? "")}>
              <SelectTrigger><SelectValue placeholder="انتخاب ساکن" /></SelectTrigger>
              <SelectContent>
                {residents.map(r => <SelectItem key={r.id} value={r.id}>{r.firstName} {r.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>مبلغ (تومان) *</Label>
            <Input type="number" value={amount || ""} onChange={e => setAmount(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>روش پرداخت</Label>
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
            <Label>تاریخ</Label>
            <Input value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>توضیحات</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>عکس رسید</Label>
            <div className="flex flex-wrap gap-2">
              {receiptPhotos.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} alt="" className="h-16 w-16 object-cover rounded border" />
                  <button type="button" onClick={() => setReceiptPhotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="h-2.5 w-2.5" /></button>
                </div>
              ))}
              {receiptPhotos.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="h-16 w-16 border-2 border-dashed rounded flex items-center justify-center hover:bg-muted/50">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />
            </div>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : null}
            ثبت پرداخت
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
