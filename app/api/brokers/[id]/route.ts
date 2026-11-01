import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.brokerAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Broker account deleted." });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.brokerAccount.update({
      where: { id },
      data: {
        ...(typeof body.isActive === "boolean" && { isActive: body.isActive }),
        ...(typeof body.isLiveTrading === "boolean" && { isLiveTrading: body.isLiveTrading }),
        ...(body.name && { name: body.name }),
      },
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}
