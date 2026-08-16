import { AppLayout } from "@/components/layout/app-layout";
import { QuickCheckinForm } from "./form";

export default function QuickCheckinPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">پذیرش سریع</h1>
        <QuickCheckinForm />
      </div>
    </AppLayout>
  );
}
