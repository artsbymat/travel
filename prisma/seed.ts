import "dotenv/config";

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const password = "password123";

async function main() {
  const hashedPassword = await hash(password, 10);

  const vendor = await prisma.vendor.upsert({
    where: { slug: "dummy-travel" },
    update: {
      name: "Dummy Travel",
      email: "vendor@example.com",
      phone: "081234567890",
      isActive: true,
      isHeld: false,
    },
    create: {
      name: "Dummy Travel",
      slug: "dummy-travel",
      description: "Vendor dummy untuk akun seed development.",
      address: "Jl. Dummy No. 1",
      email: "vendor@example.com",
      phone: "081234567890",
      isActive: true,
    },
  });

  const users = [
    {
      name: "Super Admin",
      email: "superadmin@example.com",
      phone: "081111111111",
      role: Role.SUPER_ADMIN,
      vendorId: null,
    },
    {
      name: "Owner Dummy",
      email: "owner@example.com",
      phone: "082222222222",
      role: Role.OWNER,
      vendorId: vendor.id,
    },
    {
      name: "Staff Dummy",
      email: "staff@example.com",
      phone: "083333333333",
      role: Role.STAFF,
      vendorId: vendor.id,
    },
    {
      name: "Driver Dummy",
      email: "driver@example.com",
      phone: "084444444444",
      role: Role.DRIVER,
      vendorId: vendor.id,
    },
  ];

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          phone: user.phone,
          password: hashedPassword,
          role: user.role,
          vendorId: user.vendorId,
        },
        create: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          password: hashedPassword,
          role: user.role,
          vendorId: user.vendorId,
        },
      }),
    ),
  );

  console.log("Dummy accounts created:");
  console.table(
    users.map(({ email, role }) => ({
      email,
      role,
      password,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
