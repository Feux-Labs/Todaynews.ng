import { NextResponse } from "next/server";
import { adminStore } from "@/app/api/auth/[...nextauth]/options";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = adminStore.update(params.id, {
      name: body.name,
      role: body.role,
      active: body.active,
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("[Admin User PATCH Error]:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = adminStore.delete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin User DELETE Error]:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
