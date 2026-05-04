import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { OwnerCreatePayload } from "@/types/owner-api";
import { InvitationEmail } from "@/components/template/invitationEmail";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USER!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

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
        isActive: true,
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
    const { name, email, phone, vendorId } = body;

    // Basic validation
    if (!name || !email || !vendorId) {
      return NextResponse.json(
        { error: "Name, email, and vendorId are required" },
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

    // Generate secure random default password (owner must set their own via invitation)
    const defaultPassword = randomBytes(16).toString("hex");
    const hashedPassword = await hash(defaultPassword, 10);

    // Create user with isActive: false — will be activated after owner accepts invitation
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        isActive: false,
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

    // Create invitation token (valid for 7 days)
    const inviteToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token: inviteToken, userId: user.id, expiresAt },
    });

    // Send invitation email
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const html = await render(
      InvitationEmail({
        userName: user.name,
        inviteToken,
        baseUrl,
        vendorName: user.vendor?.name ?? undefined,
        expiresInDays: 7,
      }),
    );

    try {
      await transporter.sendMail({
        from: process.env.NODEMAILER_USER!,
        to: email,
        subject: "Undangan Akun Owner — FluxFleet",
        html,
      });
      console.log("[create-owner] Invitation email sent to:", email);
    } catch (mailError) {
      console.error("[create-owner] Failed to send invitation email:", mailError);
      // Don't fail the request — owner was created; admin can resend manually
    }

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
