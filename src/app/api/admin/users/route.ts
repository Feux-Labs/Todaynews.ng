import { NextResponse } from "next/server";
import { adminStore } from "@/app/api/auth/[...nextauth]/options";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = adminStore.getAll();
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

    const hashedPassword = bcrypt.hashSync(password, 10);
    const created = adminStore.create({
      name,
      email,
      hashedPassword,
      role: role || "EDITOR",
      active: true,
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
