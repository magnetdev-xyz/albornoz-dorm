import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, dormName: "خوابگاه البرز", logo: "" },
  });

  const roomTypes = [
    { name: "۲ تخته", capacity: 2 },
    { name: "۴ تخته", capacity: 4 },
    { name: "۶ تخته", capacity: 6 },
    { name: "۱۰ تخته", capacity: 10 },
  ];

  const createdTypes: Record<string, string> = {};
  for (const rt of roomTypes) {
    const created = await prisma.roomType.upsert({
      where: { id: `seed-${rt.name}` },
      update: {},
      create: { id: `seed-${rt.name}`, name: rt.name, capacity: rt.capacity },
    });
    createdTypes[rt.name] = created.id;
  }

  const tariffs = [
    { n: "۲ تخته", s: "DAILY", p: 150_000 },
    { n: "۲ تخته", s: "MONTHLY", p: 3_500_000 },
    { n: "۴ تخته", s: "DAILY", p: 120_000 },
    { n: "۴ تخته", s: "MONTHLY", p: 2_800_000 },
    { n: "۶ تخته", s: "DAILY", p: 100_000 },
    { n: "۶ تخته", s: "MONTHLY", p: 2_200_000 },
    { n: "۱۰ تخته", s: "DAILY", p: 80_000 },
    { n: "۱۰ تخته", s: "MONTHLY", p: 1_800_000 },
  ];

  for (const t of tariffs) {
    await prisma.tariff.upsert({
      where: { id: `seed-${t.n}-${t.s}` },
      update: {},
      create: { id: `seed-${t.n}-${t.s}`, roomTypeId: createdTypes[t.n], stayType: t.s, price: t.p },
    });
  }

  console.log("Seed complete");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
