import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export type AdminSessionUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "EDITOR" | "REVIEWER";
};

export async function getAdminSession(): Promise<AdminSessionUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    return session.user as AdminSessionUser;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSessionUser> {
  const user = await getAdminSession();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (user.role !== "SUPERADMIN") {
    throw new Error("FORBIDDEN: SuperAdmin access required");
  }
  return user;
}
