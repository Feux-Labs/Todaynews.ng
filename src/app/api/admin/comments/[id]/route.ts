import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin: approve or reject a pending comment. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.comment.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (err) {
    console.error("[Admin Comments PATCH] Failed:", err);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

/** Admin: permanently delete a comment. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.comment.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Comments DELETE] Failed:", err);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
