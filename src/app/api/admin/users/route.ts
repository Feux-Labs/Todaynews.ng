import { NextResponse } from "next/server";
import { createAdminUser, listAdminUsers } from "@/lib/adminUsers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await listAdminUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const created = await createAdminUser({
      name,
      email,
      password,
      role: role || "EDITOR",
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
