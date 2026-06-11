import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Detail payroll period with all slips
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: "No vendor assigned" }, { status: 400 });
    }

    const { id } = await params;

    const period = await prisma.payrollPeriod.findFirst({
      where: { id, vendorId },
      include: {
        slips: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: { select: { name: true } },
              },
            },
            items: {
              orderBy: { createdAt: "asc" },
            },
            commissions: {
              orderBy: { tripDate: "asc" },
            },
          },
          orderBy: [
            { user: { role: { name: "asc" } } },
            { user: { name: "asc" } },
          ],
        },
      },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }

    return NextResponse.json(period);
  } catch (error) {
    console.error("Error fetching payroll period:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update period status (approve / mark as paid)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: "No vendor assigned" }, { status: 400 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    // Verify period belongs to this vendor
    const period = await prisma.payrollPeriod.findFirst({
      where: { id, vendorId },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["APPROVED"],
      APPROVED: ["PAID", "DRAFT"],
      PAID: [],
    };

    if (status && !validTransitions[period.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Tidak bisa mengubah status dari ${period.status} ke ${status}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === "APPROVED") updateData.approvedAt = new Date();
      if (status === "PAID") updateData.paidAt = new Date();
      if (status === "DRAFT") {
        updateData.approvedAt = null;
        updateData.paidAt = null;
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    // Update period and all slip statuses
    const result = await prisma.$transaction(async (tx) => {
      const updatedPeriod = await tx.payrollPeriod.update({
        where: { id },
        data: updateData,
      });

      // Sync slip statuses
      if (status) {
        const slipStatus =
          status === "APPROVED"
            ? "APPROVED"
            : status === "PAID"
              ? "PAID"
              : "PENDING";

        await tx.payrollSlip.updateMany({
          where: { periodId: id },
          data: { status: slipStatus },
        });
      }

      return updatedPeriod;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating payroll period:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete a draft payroll period
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: "No vendor assigned" }, { status: 400 });
    }

    const { id } = await params;

    const period = await prisma.payrollPeriod.findFirst({
      where: { id, vendorId },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }

    if (period.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Hanya payroll berstatus DRAFT yang bisa dihapus" },
        { status: 400 }
      );
    }

    await prisma.payrollPeriod.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payroll period:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
