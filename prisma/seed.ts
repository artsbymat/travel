/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcrypt";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD = "password123";

// ─── Wilayah ────────────────────────────────────────────────────────────────

async function seedIndonesiaRegions() {
  console.log("\n📍 Seeding wilayah Indonesia dari wilayah.id...");
  const provincesRes = await fetch("https://wilayah.id/api/provinces.json");
  const provincesData: any = await provincesRes.json();
  const provinces: any[] = provincesData.data;
  console.log(`   Ditemukan ${provinces.length} provinsi.`);

  for (const p of provinces) {
    try {
      const province = await prisma.province.upsert({
        where: { name: p.name },
        update: { code: p.code },
        create: { name: p.name, code: p.code },
      });

      const citiesRes = await fetch(`https://wilayah.id/api/regencies/${p.code}.json`);
      const citiesData: any = await citiesRes.json();

      for (const r of citiesData.data ?? []) {
        try {
          await prisma.city.upsert({
            where: { code: r.code },
            update: { name: r.name, provinceId: province.id },
            create: { name: r.name, code: r.code, provinceId: province.id },
          });
        } catch {
          // skip duplicate
        }
      }
      process.stdout.write(`   ✓ ${p.name}\n`);
    } catch (err) {
      console.error(`   ✗ Gagal seed provinsi ${p.name}:`, err);
    }
  }
  console.log("   Selesai seeding wilayah.");
}

// ─── Main Seed ──────────────────────────────────────────────────────────────

async function main() {
  const hashedPassword = await hash(PASSWORD, 10);

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  console.log("\n👤 Seeding roles...");
  const roleNames = ["SUPER_ADMIN", "OWNER", "STAFF", "DRIVER"];
  const roles = await Promise.all(
    roleNames.map((name) =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  // ── 2. Wilayah Indonesia ──────────────────────────────────────────────────
  await seedIndonesiaRegions();

  // Pastikan kota referensi tersedia setelah seed wilayah
  const jakartaProvince = await prisma.province.upsert({
    where: { name: "DKI Jakarta" },
    update: { code: "ID-JK" },
    create: { name: "DKI Jakarta", code: "ID-JK" },
  });
  const jakartaCity = await prisma.city.upsert({
    where: { code: "31.74" },
    update: { name: "Jakarta Selatan", provinceId: jakartaProvince.id },
    create: { name: "Jakarta Selatan", code: "31.74", provinceId: jakartaProvince.id },
  });

  // Kota Bandung untuk rute dummy
  let bandungProvince = await prisma.province.findFirst({ where: { name: { contains: "Jawa Barat" } } });
  if (!bandungProvince) {
    bandungProvince = await prisma.province.create({ data: { name: "Jawa Barat", code: "ID-JB" } });
  }
  const bandungCity = await prisma.city.upsert({
    where: { code: "32.73" },
    update: { name: "Kota Bandung", provinceId: bandungProvince.id },
    create: { name: "Kota Bandung", code: "32.73", provinceId: bandungProvince.id },
  });

  // ── 3. Vendor ─────────────────────────────────────────────────────────────
  console.log("\n🏢 Seeding vendor...");
  const vendor = await prisma.vendor.upsert({
    where: { slug: "dummy-travel" },
    update: {},
    create: {
      name: "Dummy Travel",
      slug: "dummy-travel",
      description: "Vendor dummy untuk development.",
      address: "Jl. Raya Pasar Minggu No. 88, Pancoran, Jakarta Selatan",
      phone: "081234567890",
      email: "vendor@example.com",
      logo: "https://placehold.co/256x256?text=Dummy+Travel",
      isActive: true,
      isHeld: false,
      legalName: "PT Dummy Travel Nusantara",
      npwp: "123456789012345",
      siup: "SIUP/DUMMY/2026/0001",
      taxEnabled: true,
      taxRate: "11.00",
      taxName: "PPN",
      acceptCash: true,
      platformFeeRate: "5.00",
      cityId: jakartaCity.id,
    },
  });

  // ── 4. Vendor Wallet ──────────────────────────────────────────────────────
  await prisma.vendorWallet.upsert({
    where: { vendorId: vendor.id },
    update: {},
    create: { vendorId: vendor.id, balance: "0", pendingIn: "0", debt: "0", totalEarned: "0" },
  });

  // ── 5. Vendor E-Wallets ───────────────────────────────────────────────────
  console.log("💳 Seeding vendor e-wallets...");
  const ewallets = [
    { type: "GOPAY" as const, name: "GoPay Dummy Travel", accountName: "Dummy Travel", accountNo: "081234567890" },
    { type: "DANA" as const, name: "DANA Dummy Travel", accountName: "Dummy Travel", accountNo: "081234567891" },
  ];
  for (const ew of ewallets) {
    await prisma.vendorEWallet.upsert({
      where: { vendorId_type_accountNo: { vendorId: vendor.id, type: ew.type, accountNo: ew.accountNo } },
      update: {},
      create: { ...ew, vendorId: vendor.id, isActive: true },
    });
  }

  // ── 6. Vendor Policies ────────────────────────────────────────────────────
  console.log("📋 Seeding vendor policies...");
  const policies = [
    { type: "CANCELLATION" as const, title: "Kebijakan Pembatalan", content: "Pembatalan lebih dari 24 jam sebelum keberangkatan mendapat refund penuh.", order: 1 },
    { type: "REFUND" as const, title: "Kebijakan Refund", content: "Refund diproses dalam 3-5 hari kerja ke metode pembayaran asal.", order: 2 },
    { type: "LUGGAGE" as const, title: "Kebijakan Bagasi", content: "Maks 20kg bagasi per penumpang. Barang berbahaya dilarang.", order: 3 },
  ];
  for (const p of policies) {
    await prisma.vendorPolicy.upsert({
      where: { vendorId_type: { vendorId: vendor.id, type: p.type } },
      update: {},
      create: { ...p, vendorId: vendor.id, isActive: true },
    });
  }

  // ── 7. Vendor Refund Policies ─────────────────────────────────────────────
  console.log("💰 Seeding vendor refund policies...");
  const refundPolicies = [
    { hoursBeforeDeparture: 48, refundPercentage: "100.00", description: "Refund penuh jika cancel > 48 jam sebelum berangkat" },
    { hoursBeforeDeparture: 24, refundPercentage: "75.00", description: "Refund 75% jika cancel 24-48 jam sebelum berangkat" },
    { hoursBeforeDeparture: 6, refundPercentage: "50.00", description: "Refund 50% jika cancel 6-24 jam sebelum berangkat" },
    { hoursBeforeDeparture: 0, refundPercentage: "0.00", description: "Tidak ada refund jika cancel < 6 jam sebelum berangkat" },
  ];
  for (const rp of refundPolicies) {
    await prisma.vendorRefundPolicy.upsert({
      where: { vendorId_hoursBeforeDeparture: { vendorId: vendor.id, hoursBeforeDeparture: rp.hoursBeforeDeparture } },
      update: {},
      create: { ...rp, vendorId: vendor.id, isActive: true },
    });
  }

  // ── 8. Users ──────────────────────────────────────────────────────────────
  console.log("👥 Seeding users...");
  const usersData = [
    { name: "Super Admin", email: "superadmin@example.com", phone: "081111111111", roleName: "SUPER_ADMIN", vendorId: null as string | null },
    { name: "Owner Dummy Travel", email: "owner@example.com", phone: "082222222222", roleName: "OWNER", vendorId: vendor.id },
    { name: "Staff Dummy", email: "staff@example.com", phone: "083333333333", roleName: "STAFF", vendorId: vendor.id },
    { name: "Driver Budi", email: "driver@example.com", phone: "084444444444", roleName: "DRIVER", vendorId: vendor.id },
    { name: "Driver Candra", email: "driver2@example.com", phone: "085555555555", roleName: "DRIVER", vendorId: vendor.id },
    { name: "Driver Deni", email: "driver3@example.com", phone: "086666666666", roleName: "DRIVER", vendorId: vendor.id },
  ];
  const createdUsers = await Promise.all(
    usersData.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, phone: u.phone, password: hashedPassword, roleId: roleMap[u.roleName], vendorId: u.vendorId },
        create: { name: u.name, email: u.email, phone: u.phone, password: hashedPassword, roleId: roleMap[u.roleName], vendorId: u.vendorId },
      })
    )
  );
  const userMap = Object.fromEntries(createdUsers.map((u) => [u.email, u]));

  // ── 9. User Profiles (drivers) ────────────────────────────────────────────
  console.log("🪪 Seeding user profiles...");
  const driverProfiles = [
    { email: "driver@example.com", fullName: "Budi Santoso", sim: "SIM100000001", ktp: "3271010101800001" },
    { email: "driver2@example.com", fullName: "Candra Wijaya", sim: "SIM100000002", ktp: "3271010101800002" },
    { email: "driver3@example.com", fullName: "Deni Kurniawan", sim: "SIM100000003", ktp: "3271010101800003" },
  ];
  for (const dp of driverProfiles) {
    const u = userMap[dp.email];
    if (u) {
      await prisma.userProfile.upsert({
        where: { userId: u.id },
        update: {},
        create: { userId: u.id, fullName: dp.fullName, simNumber: dp.sim, ktpNumber: dp.ktp, address: "Jl. Contoh No. 1, Jakarta Selatan" },
      });
    }
  }

  // ── 10. Vehicles ──────────────────────────────────────────────────────────
  console.log("🚐 Seeding vehicles...");
  const vehiclesData = [
    {
      licensePlate: "B 1001 DT",
      name: "Avanza 01",
      brand: "Toyota",
      model: "Avanza",
      year: 2022,
      capacity: 7,
      color: "Putih",
      seatLayout: {
        rows: 3, columns: 3, seats: [
          { no: "1A", row: 1, col: 1 }, { no: "1B", row: 1, col: 2 }, { no: "1C", row: 1, col: 3 },
          { no: "2A", row: 2, col: 1 }, { no: "2B", row: 2, col: 2 }, { no: "2C", row: 2, col: 3 },
          { no: "3A", row: 3, col: 1 },
        ]
      },
    },
    {
      licensePlate: "B 1002 DT",
      name: "Innova 01",
      brand: "Toyota",
      model: "Innova",
      year: 2023,
      capacity: 8,
      color: "Hitam",
      seatLayout: {
        rows: 3, columns: 3, seats: [
          { no: "1A", row: 1, col: 1 }, { no: "1B", row: 1, col: 2 }, { no: "1C", row: 1, col: 3 },
          { no: "2A", row: 2, col: 1 }, { no: "2B", row: 2, col: 2 }, { no: "2C", row: 2, col: 3 },
          { no: "3A", row: 3, col: 1 }, { no: "3B", row: 3, col: 2 },
        ]
      },
    },
    {
      licensePlate: "B 1003 DT",
      name: "Hiace 01",
      brand: "Toyota",
      model: "Hiace",
      year: 2021,
      capacity: 14,
      color: "Silver",
      seatLayout: {
        rows: 5, columns: 3, seats: [
          { no: "1A", row: 1, col: 1 }, { no: "1B", row: 1, col: 2 }, { no: "1C", row: 1, col: 3 },
          { no: "2A", row: 2, col: 1 }, { no: "2B", row: 2, col: 2 }, { no: "2C", row: 2, col: 3 },
          { no: "3A", row: 3, col: 1 }, { no: "3B", row: 3, col: 2 }, { no: "3C", row: 3, col: 3 },
          { no: "4A", row: 4, col: 1 }, { no: "4B", row: 4, col: 2 }, { no: "4C", row: 4, col: 3 },
          { no: "5A", row: 5, col: 1 }, { no: "5B", row: 5, col: 2 },
        ]
      },
    },
  ];
  const createdVehicles = await Promise.all(
    vehiclesData.map((v) =>
      prisma.vehicle.upsert({
        where: { licensePlate: v.licensePlate },
        update: {},
        create: { ...v, vendorId: vendor.id, status: "ACTIVE" },
      })
    )
  );
  const [vehicleA, vehicleB, vehicleC] = createdVehicles;
  const [, , , driverBudi, driverCandra, driverDeni] = createdUsers;

  // ── 11. Trip Template ─────────────────────────────────────────────────────
  console.log("📅 Seeding trip template...");
  const template = await prisma.tripTemplate.upsert({
    where: { id: "seed-template-jkt-bdg-weekday" },
    update: {},
    create: {
      id: "seed-template-jkt-bdg-weekday",
      vendorId: vendor.id,
      name: "Jakarta - Bandung Weekday",
      origin: "Jakarta",
      destination: "Bandung",
      originDetail: "Terminal Kampung Rambutan",
      destinationDetail: "Terminal Leuwipanjang",
      price: "150000",
      amenities: ["AC", "WIFI", "USB"],
      minBooking: 1,
      bookingDeadlineHours: 2,
      isActive: true,
    },
  });

  // ── 12. Trip Template Schedules ───────────────────────────────────────────
  console.log("🗓️  Seeding trip template schedules...");
  const WEEKDAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
  const scheduleMatrix = [
    // Vehicle A (Avanza) - Budi - jam pagi
    { vehicleId: vehicleA.id, driverId: driverBudi.id, times: ["07:00", "07:00", "07:30", "07:00", "07:00"] },
    // Vehicle B (Innova) - Candra - jam siang
    { vehicleId: vehicleB.id, driverId: driverCandra.id, times: ["09:00", "09:30", "09:00", "09:00", "09:30"] },
    // Vehicle C (Hiace)  - Deni   - jam sore
    { vehicleId: vehicleC.id, driverId: driverDeni.id, times: ["13:00", "13:00", "14:00", "13:00", "13:00"] },
  ];

  for (const row of scheduleMatrix) {
    for (let i = 0; i < WEEKDAYS.length; i++) {
      const day = WEEKDAYS[i];
      const time = row.times[i];
      try {
        await prisma.tripTemplateSchedule.upsert({
          where: {
            templateId_vehicleId_dayOfWeek_departureTime: {
              templateId: template.id, vehicleId: row.vehicleId, dayOfWeek: day, departureTime: time,
            }
          },
          update: {},
          create: { templateId: template.id, vehicleId: row.vehicleId, driverId: row.driverId, dayOfWeek: day, departureTime: time, isActive: true },
        });
      } catch {
        // skip duplicate
      }
    }
  }

  // ── 13. Trips (7 hari ke depan dari template) ─────────────────────────────
  console.log("🚌 Seeding trips (7 hari ke depan)...");
  const DAY_MAP: Record<number, typeof WEEKDAYS[number]> = { 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY", 4: "THURSDAY", 5: "FRIDAY" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dow = date.getDay(); // 0=Sun, 6=Sat
    if (!DAY_MAP[dow]) continue;

    for (const row of scheduleMatrix) {
      for (let d = 0; d < WEEKDAYS.length; d++) {
        if (DAY_MAP[dow] !== WEEKDAYS[d]) continue;
        const time = row.times[d];
        const [hh, mm] = time.split(":").map(Number);
        const departureTime = new Date(date);
        departureTime.setHours(hh, mm, 0, 0);

        const existing = await prisma.trip.findFirst({
          where: { templateId: template.id, vehicleId: row.vehicleId, departureTime },
          select: { id: true },
        });
        if (existing) continue;

        const vehicle = createdVehicles.find((v) => v.id === row.vehicleId)!;
        const seats = (vehicle.seatLayout as any)?.seats ?? [];
        const bookingDeadline = new Date(departureTime.getTime() - 2 * 3600_000);

        await prisma.trip.create({
          data: {
            origin: "Jakarta",
            destination: "Bandung",
            originDetail: "Terminal Kampung Rambutan",
            destinationDetail: "Terminal Leuwipanjang",
            departureTime,
            price: "150000",
            amenities: ["AC", "WIFI", "USB"],
            minBooking: 1,
            bookingDeadline,
            vehicleId: row.vehicleId,
            driverId: row.driverId,
            templateId: template.id,
            seats: {
              create: seats.map((s: any) => ({
                seatNo: s.no,
                row: s.row,
                column: s.col,
                status: "AVAILABLE",
              })),
            },
          },
        });
      }
    }
  }

  // ── 14. Vendor Billing (contoh) ───────────────────────────────────────────
  console.log("🧾 Seeding vendor billing...");
  const billingInvoice = "INV/DUMMY/2026/001";
  const existingBilling = await prisma.vendorBilling.findUnique({ where: { invoiceNo: billingInvoice } });
  if (!existingBilling) {
    await prisma.vendorBilling.create({
      data: {
        invoiceNo: billingInvoice,
        vendorId: vendor.id,
        periodStart: new Date("2026-04-01"),
        periodEnd: new Date("2026-04-30"),
        dueDate: new Date("2026-05-10"),
        totalBookings: 0,
        totalGrossAmount: "0",
        totalFeeAmount: "0",
        paidAmount: "0",
        status: "UNPAID",
      },
    });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seeding selesai!\n");
  console.log("Akun tersedia:");
  console.table(
    usersData.map(({ email, roleName, vendorId: vId }) => ({
      email,
      role: roleName,
      vendor: vId ? vendor.name : "-",
      password: PASSWORD,
    }))
  );
  console.table([
    { vendor: vendor.name, city: jakartaCity.name, province: jakartaProvince.name },
    { vendor: "(dest ref)", city: bandungCity.name, province: bandungProvince.name },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
