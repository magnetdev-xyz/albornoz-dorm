"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { quickCheckin } from "@/actions/residents";
import { formatPrice, todayJalali } from "@/lib/utils";
import { getJalaliParts } from "@/lib/utils";

interface RoomType { id: string; name: string; capacity: number; tariffs: { stayType: string; price: number }[]; }
interface Floor { id: string; name: string; }
interface Room { id: string; number: string; floorId: string; roomTypeId: string; roomType: { name: string; capacity: number }; }
interface Bed { id: string; number: string; }

export function QuickCheckinForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedRoomType, setSelectedRoomType] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [contractAmount, setContractAmount] = useState(0);
  const [photoBase64, setPhotoBase64] = useState("");

  // Form state (manual to avoid zod complexity for date)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [stayType, setStayType] = useState<"DAILY" | "MONTHLY">("MONTHLY");
  const [duration, setDuration] = useState(1);
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(todayJalali());

  // Document checkboxes
  const [docNationalCard, setDocNationalCard] = useState(false);
  const [docBirthCert, setDocBirthCert] = useState(false);
  const [docDriverLicense, setDocDriverLicense] = useState(false);
  const [docMilitaryCard, setDocMilitaryCard] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    const [rt, fl, rm] = await Promise.all([
      fetch("/api/room-types").then(r => r.json()),
      fetch("/api/floors").then(r => r.json()),
      fetch("/api/rooms").then(r => r.json()),
    ]);
    setRoomTypes(rt); setFloors(fl); setRooms(rm); setFilteredRooms(rm);
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  // Filter rooms
  useEffect(() => {
    let f = [...rooms];
    if (selectedFloor !== "all") f = f.filter(r => r.floorId === selectedFloor);
    if (selectedRoomType !== "all") f = f.filter(r => r.roomTypeId === selectedRoomType);
    setFilteredRooms(f);
  }, [selectedFloor, selectedRoomType, rooms]);

  // Price calculation
  useEffect(() => {
    if (!roomId) { setSelectedPrice(0); return; }
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const rt = roomTypes.find(rt => rt.id === room.roomTypeId);
    if (!rt) return;
    const tariff = rt.tariffs.find(t => t.stayType === stayType);
    if (tariff) setSelectedPrice(tariff.price);
  }, [roomId, stayType, rooms, roomTypes]);
  useEffect(() => { setContractAmount(selectedPrice * (duration || 1)); }, [selectedPrice, duration]);

  // Available beds
  useEffect(() => {
    if (!roomId) { setAvailableBeds([]); return; }
    fetch(`/api/beds/available?roomId=${roomId}`).then(r => r.json()).then(setAvailableBeds);
  }, [roomId]);

  // Photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Jalali date picker (3 separate inputs: year, month, day)
  const parts = getJalaliParts(startDate) ?? { year: 1404, month: 1, day: 1 };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !fatherName || !nationalCode || !phone) {
      toast.error("لطفاً تمام فیلدهای اجباری را پر کنید"); return;
    }
    if (nationalCode.length !== 10 || !/^\d{10}$/.test(nationalCode)) {
      toast.error("کد ملی نامعتبر است"); return;
    }
    if (phone.length !== 11 || !/^09\d{9}$/.test(phone)) {
      toast.error("شماره موبایل نامعتبر است"); return;
    }
    if (!roomId) { toast.error("لطفاً اتاق را انتخاب کنید"); return; }
    if (!bedId) { toast.error("لطفاً تخت را انتخاب کنید"); return; }

    setLoading(true);
    try {
      await quickCheckin({
        firstName, lastName, fatherName, nationalCode, phone,
        photo: photoBase64, bedId, stayType, startDate, duration,
        contractAmount, description,
        documents: {
          nationalCard: docNationalCard,
          birthCert: docBirthCert,
          driverLicense: docDriverLicense,
          militaryCard: docMilitaryCard,
        },
      });
      toast.success("ثبت نام با موفقیت انجام شد");
      router.push("/residents");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطا در ثبت نام");
    } finally { setLoading(false); }
  };

  const handlePrevStep = () => setStep(s => Math.max(1, s - 1));
  const handleNextStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !fatherName || !nationalCode || !phone) {
        toast.error("لطفاً تمام فیلدهای اجباری را پر کنید"); return;
      }
    }
    setStep(s => Math.min(3, s + 1));
  };

  return (
    <Card className="border-none shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <UserPlus className="h-5 w-5 text-primary" />
          پذیرش سریع
        </CardTitle>
        <CardDescription>ثبت ساکن جدید در کمتر از ۳۰ ثانیه</CardDescription>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-2 w-12 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {step === 1 ? "اطلاعات فردی" : step === 2 ? "انتخاب اقامت" : "تأیید نهایی"}
        </p>
      </CardHeader>
      <CardContent>
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>نام *</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="نام" /></div>
              <div className="space-y-1.5"><Label>نام خانوادگی *</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="نام خانوادگی" /></div>
              <div className="space-y-1.5"><Label>نام پدر *</Label><Input value={fatherName} onChange={e => setFatherName(e.target.value)} placeholder="نام پدر" /></div>
              <div className="space-y-1.5"><Label>کد ملی *</Label><Input value={nationalCode} onChange={e => setNationalCode(e.target.value)} placeholder="۱۰ رقم" maxLength={10} /></div>
              <div className="space-y-1.5"><Label>شماره موبایل *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="۰۹۱۲۳۴۵۶۷۸۹" maxLength={11} dir="ltr" /></div>
              <div className="space-y-1.5"><Label>عکس</Label><Input type="file" accept="image/*" onChange={handlePhotoChange} className="cursor-pointer" /></div>
            </div>
            {photoBase64 && <img src={photoBase64} alt="preview" className="h-20 w-20 rounded-lg object-cover border" />}

            {/* Documents */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold">مدارک تحویلی</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "کارت ملی", val: docNationalCard, set: setDocNationalCard },
                  { label: "شناسنامه", val: docBirthCert, set: setDocBirthCert },
                  { label: "گواهینامه", val: docDriverLicense, set: setDocDriverLicense },
                  { label: "کارت پایان خدمت", val: docMilitaryCard, set: setDocMilitaryCard },
                ].map(doc => (
                  <div key={doc.label} className="flex items-center justify-between p-2 rounded-lg border">
                    <Label className="text-sm cursor-pointer">{doc.label}</Label>
                    <Switch checked={doc.val} onCheckedChange={doc.set} />
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleNextStep}>ادامه → انتخاب اقامت</Button>
          </div>
        )}

        {/* STEP 2: Stay Info + Room */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>تاریخ ورود *</Label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <div>
                    <Label className="text-xs text-muted-foreground">سال</Label>
                    <Input
                      value={parts.year.toString()}
                      onChange={e => setStartDate(`${e.target.value}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`)}
                      placeholder="۱۴۰۴" maxLength={4} className="text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ماه</Label>
                    <Select value={parts.month.toString()} onValueChange={v => setStartDate(`${parts.year}-${String(Number(v)).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"].map((m, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">روز</Label>
                    <Input
                      type="number" min={1} max={31}
                      value={parts.day}
                      onChange={e => setStartDate(`${parts.year}-${String(parts.month).padStart(2, "0")}-${String(Math.min(31, Math.max(1, Number(e.target.value) || 1))).padStart(2, "0")}`)}
                      className="text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stay type + duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>نوع اقامت *</Label>
                <Select value={stayType} onValueChange={v => setStayType(v as "DAILY" | "MONTHLY")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">روزانه</SelectItem>
                    <SelectItem value="MONTHLY">ماهانه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{stayType === "DAILY" ? "تعداد روز" : "تعداد ماه"} *</Label>
                <Input type="number" value={duration} onChange={e => setDuration(Math.max(1, Number(e.target.value) || 1))} min={1} />
              </div>
              <div className="space-y-1.5">
                <Label>مبلغ قرارداد</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted/30 text-sm font-bold text-emerald-700">
                  {formatPrice(contractAmount)}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">فیلتر طبقه</Label>
                <Select value={selectedFloor} onValueChange={v => setSelectedFloor(v ?? "all")}>
                  <SelectTrigger><SelectValue placeholder="همه طبقات" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه طبقات</SelectItem>
                    {floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">فیلتر نوع اتاق</Label>
                <Select value={selectedRoomType} onValueChange={v => setSelectedRoomType(v ?? "all")}>
                  <SelectTrigger><SelectValue placeholder="همه انواع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    {roomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Room Selection */}
            <div className="space-y-1.5">
              <Label>انتخاب اتاق *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredRooms.map(r => (
                  <button key={r.id} type="button" onClick={() => { setRoomId(r.id); setBedId(""); }}
                    className={`p-3 rounded-lg border text-center text-sm transition-all ${
                      roomId === r.id ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-white hover:bg-muted border-input hover:border-primary/50"
                    }`}>
                    <div className="font-bold">اتاق {r.number}</div>
                    <div className="text-xs opacity-70">{r.roomType.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bed Selection */}
            {roomId && (
              <div className="space-y-1.5">
                <Label>انتخاب تخت *</Label>
                {availableBeds.length === 0 ? (
                  <p className="text-sm text-destructive">هیچ تخت خالی در این اتاق وجود ندارد</p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {availableBeds.map(bed => (
                      <button key={bed.id} type="button" onClick={() => setBedId(bed.id)}
                        className={`p-3 rounded-lg border text-center text-sm font-medium transition-all ${
                          bedId === bed.id ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-white hover:bg-muted border-input"
                        }`}>{bed.number}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>توضیحات</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="توضیحات اضافی..." />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handlePrevStep}>بازگشت</Button>
              <Button className="flex-1" onClick={handleNextStep}>ادامه → تأیید نهایی</Button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 bg-muted/20">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">نام:</span><span className="font-medium">{firstName} {lastName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">کد ملی:</span><span className="font-medium">{nationalCode}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">موبایل:</span><span className="font-medium">{phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">تاریخ ورود:</span><span className="font-medium">{startDate}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">نوع اقامت:</span><span className="font-medium">{stayType === "DAILY" ? "روزانه" : "ماهانه"} - {duration} {stayType === "DAILY" ? "روز" : "ماه"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">اتاق/تخت:</span><span className="font-medium">{rooms.find(r => r.id === roomId)?.number} / {availableBeds.find(b => b.id === bedId)?.number}</span></div>
              <div className="flex justify-between text-sm border-t pt-2"><span className="text-muted-foreground">مبلغ:</span><span className="font-bold text-emerald-700">{formatPrice(contractAmount)}</span></div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handlePrevStep}>بازگشت</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <UserPlus className="h-4 w-4 ml-2" />}
                تأیید و ثبت
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
