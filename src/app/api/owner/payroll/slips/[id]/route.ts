import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

// GET: Get slip details with all items and commissions
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

    const slip = await prisma.payrollSlip.findFirst({
      where: {
        id,
        period: { vendorId },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: { select: { name: true } },
          },
        },
        items: { orderBy: { createdAt: "asc" } },
        commissions: { orderBy: { tripDate: "asc" } },
        period: {
          select: { month: true, year: true, status: true },
        },
      },
    });

    if (!slip) {
      return NextResponse.json({ error: "Slip not found" }, { status: 404 });
    }

    return NextResponse.json(slip);
  } catch (error) {
    console.error("Error fetching slip:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Add bonus/deduction to a slip or update notes
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
    const { action, type, label, amount, notes, itemId } = body;

    // Verify slip belongs to this vendor and is editable
    const slip = await prisma.payrollSlip.findFirst({
      where: {
        id,
        period: { vendorId, status: "DRAFT" },
      },
      include: { items: true },
    });

    if (!slip) {
      return NextResponse.json(
        { error: "Slip tidak ditemukan atau payroll sudah di-approve/paid" },
        { status: 404 }
      );
    }

    if (action === "add_item") {
      // Add a bonus or deduction
      if (!type || !["BONUS", "DEDUCTION"].includes(type)) {
        return NextResponse.json({ error: "Type must be BONUS or DEDUCTION" }, { status: 400 });
      }
      if (!label || !amount || Number(amount) <= 0) {
        return NextResponse.json({ error: "Label and positive amount are required" }, { status: 400 });
      }

      await prisma.payrollSlipItem.create({
        data: {
          slipId: id,
          type,
          label,
          amount: Number(amount),
        },
      });
    } else if (action === "remove_item") {
      // Remove a bonus/deduction item
      if (!itemId) {
        return NextResponse.json({ error: "itemId is required" }, { status: 400 });
      }

      const item = await prisma.payrollSlipItem.findFirst({
        where: { id: itemId, slipId: id, type: { in: ["BONUS", "DEDUCTION"] } },
      });

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      await prisma.payrollSlipItem.delete({ where: { id: itemId } });
    } else if (action === "update_notes") {
      await prisma.payrollSlip.update({
        where: { id },
        data: { notes: notes || null },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Recalculate totals
    const allItems = await prisma.payrollSlipItem.findMany({
      where: { slipId: id },
    });

    let totalBonus = new Decimal(0);
    let totalDeduction = new Decimal(0);

    for (const item of allItems) {
      if (item.type === "BONUS") totalBonus = totalBonus.add(item.amount);
      if (item.type === "DEDUCTION") totalDeduction = totalDeduction.add(item.amount);
    }

    const netAmount = new Decimal(slip.baseSalary)
      .add(new Decimal(slip.totalCommission))
      .add(totalBonus)
      .sub(totalDeduction);

    const updatedSlip = await prisma.payrollSlip.update({
      where: { id },
      data: {
        totalBonus,
        totalDeduction,
        netAmount: netAmount.greaterThan(0) ? netAmount : 0,
      },
      include: {
        user: {
          select: { id: true, name: true, role: { select: { name: true } } },
        },
        items: { orderBy: { createdAt: "asc" } },
        commissions: { orderBy: { tripDate: "asc" } },
      },
    });

    // Update period total
    const periodSlips = await prisma.payrollSlip.findMany({
      where: { periodId: slip.periodId },
    });
    const periodTotal = periodSlips.reduce(
      (sum, s) => sum.add(new Decimal(s.netAmount)),
      new Decimal(0)
    );
    await prisma.payrollPeriod.update({
      where: { id: slip.periodId },
      data: { totalAmount: periodTotal },
    });

    return NextResponse.json(updatedSlip);
  } catch (error) {
    console.error("Error updating slip:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
