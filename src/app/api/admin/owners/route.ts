import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { OwnerCreatePayload } from "@/types/owner-api";

// GET: List all owners
export async function GET() {
  try {
    const owners = await prisma.user.findMany({
      where: {
        role: { name: "OWNER" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        vendorId: true,
        createdAt: true,
        updatedAt: true,
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(owners);
  } catch (error) {
    console.error("Error fetching owners:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create a new owner
export async function POST(req: NextRequest) {
  try {
    const body: OwnerCreatePayload = await req.json();
    const { name, email, phone, password, vendorId } = body;

    // Basic validation
    if (!name || !email || !password || !vendorId) {
      return NextResponse.json(
        { error: "Name, email, password, and vendorId are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: phone || undefined }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: {
          connect: { name: "OWNER" },
        },
        vendor: {
          connect: { id: vendorId },
        },
        profile: {
          create: {
            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              name
            )}&background=random&size=128`,
          },
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      }
    })

    // Don't return password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating owner:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
