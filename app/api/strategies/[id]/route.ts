import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.strategy.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Strategy deleted" });
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

    const updated = await prisma.strategy.update({
      where: { id },
      data: {
        ...(typeof body.isLive === "boolean" && { isLive: body.isLive }),
        ...(typeof body.isPublic === "boolean" && { isPublic: body.isPublic }),
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.riskMultiplierDefault && {
          riskMultiplierDefault: Number(body.riskMultiplierDefault),
        }),
      },
    });

    return NextResponse.json({ success: true, strategy: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update strategy" },
      { status: 500 }
    );
  }
}
