import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { OwnerUpdatePayload } from "@/types/owner-api";
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

type Props = {
  params: Promise<{ id: string }>;
};

async function sendOwnerInvitationEmail(user: {
  id: string;
  name: string;
  email: string | null;
  vendor?: { name: string } | null;
}) {
  if (!user.email) {
    throw new Error("Owner email is required to send invitation");
  }

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  const inviteToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token: inviteToken, userId: user.id, expiresAt },
  });

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

  await transporter.sendMail({
    from: process.env.NODEMAILER_USER!,
    to: user.email,
    subject: "Undangan Akun Owner — FluxFleet",
    html,
  });
}

// GET: Get single owner details
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const owner = await prisma.user.findFirst({
      where: {
        id,
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
        vendor: true,
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    return NextResponse.json(owner);
  } catch (error) {
    console.error("Error fetching owner detail:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: Update owner
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, password, vendorId } = body;
    const nextEmail = typeof email === "string" ? email.trim() : undefined;
    const nextPhone = typeof phone === "string" ? phone.trim() : undefined;

    // Check if owner exists
    const owner = await prisma.user.findFirst({
      where: {
        id,
        role: { name: "OWNER" },
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    if (nextEmail && nextEmail !== owner.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: nextEmail,
          NOT: { id },
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }
    }

    if (nextPhone && nextPhone !== owner.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: nextPhone,
          NOT: { id },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "User with this phone already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: OwnerUpdatePayload = {};
    if (name) updateData.name = name;
    if (nextEmail) updateData.email = nextEmail;
    if (nextPhone) updateData.phone = nextPhone;
    if (vendorId) {
      // Verify vendor exists
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 400 });
      }
      updateData.vendorId = vendorId;
    }
    if (password) {
      updateData.password = await hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!updatedUser.isActive) {
      try {
        await sendOwnerInvitationEmail(updatedUser);
        console.log("[update-owner] Invitation email sent to:", updatedUser.email);
      } catch (mailError) {
        console.error("[update-owner] Failed to send invitation email:", mailError);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating owner:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete owner
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // Check if owner exists
    const owner = await prisma.user.findFirst({
      where: {
        id,
        role: { name: "OWNER" },
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Owner deleted successfully" });
  } catch (error) {
    console.error("Error deleting owner:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
